package main

import (
  "strings"
  "fmt"
  "time"
  "os"
  "io/ioutil"
  "syscall"
)

var read_buffer [64]byte

func consume_event(fd int) (err error) {
  _,err = syscall.Seek(fd, 0, 0)
  if err != nil {
    return err
  }
  _,err = syscall.Read(fd, read_buffer[:])
  if err != nil {
    return err
  }
  return nil
}

func export_gpio_pin(pin_number int) (err error) {
  // Export GPIO device
  err = ioutil.WriteFile("/sys/class/gpio/export", []byte(fmt.Sprintf("%d\n", pin_number)), 0644)
  if err != nil {
    if strings.Contains(err.Error(), "device or resource busy") {
      fmt.Printf("GPIO pin %d already appears to be exported, continuing..\n", pin_number)
      err = nil
    }
  }
  return err
}

func set_gpio_edge_interrupt_mode(pin_number int, mode string) (err error) {
  return ioutil.WriteFile(fmt.Sprintf("/sys/class/gpio/gpio%s/edge", pin_number), []byte(mode + "\n"), 0644)
}

func produce_events(epoll_fd int) (chan time.Time, chan error){
  times := make(chan time.Time, 64)
  errors := make(chan error)
  go func() {
    for {
      var epoll_events []syscall.EpollEvent
      n,err := syscall.EpollWait(epoll_fd, epoll_events, -1)
      if err != nil {
        errors <- err
        close(times)
        close(errors)
        break
      }
      if n >= 1 {
        times <- time.Now()
      }

      // Consume interrupt
      for _,epoll_event := range epoll_events {
        err = consume_event((int)(epoll_event.Fd))
        if err != nil {
          errors <- err
          close(times)
          close(errors)
          break
        }
      }
    }
  }()
  return times,errors
}

const gpio_pin_min_number = 2
const gpio_pin_max_number = 26

func main() {
  // Export pins
  for pin := gpio_pin_min_number; pin <= gpio_pin_max_number; pin++ {
    err := export_gpio_pin(pin)
    if err != nil {
      fmt.Println(os.Stderr, err)
      os.Exit(1)
    }
  }

  // HACK: Wait for pins to be exported
  // There doesn't seem to be a good wait to do this. See https://github.com/raspberrypi/linux/issues/553
  time.Sleep(time.Second)

  // Set edge interrupt mode
  for pin := gpio_pin_min_number; pin <= gpio_pin_max_number; pin++ {
    err := set_gpio_edge_interrupt_mode(pin, "both")
    if err != nil {
      fmt.Println(os.Stderr, err)
      os.Exit(1)
    }
  }

  var gpio_pin_value_files [gpio_pin_max_number-gpio_pin_min_number]int
  for pin := gpio_pin_min_number; pin <= gpio_pin_max_number; pin++ {
    gpio_value_file,err := syscall.Open(fmt.Sprintf("/sys/class/gpio/gpio%d/value", pin), syscall.O_RDONLY, 0)
    if err != nil {
      fmt.Println(os.Stderr, err)
      os.Exit(1)
    }
    err = consume_event(gpio_value_file)
    if err != nil {
      fmt.Println(os.Stderr, err)
      os.Exit(1)
    }
    gpio_pin_value_files[pin-gpio_pin_min_number] = gpio_value_file
    defer syscall.Close(gpio_value_file)
  }

  // Setup EPoll
  epoll_fd,err := syscall.EpollCreate(gpio_pin_max_number-gpio_pin_min_number)
  if err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }
  for gpio_value_file := range gpio_pin_value_files {
    epoll_event := syscall.EpollEvent{Events: syscall.EPOLLPRI, Fd: (int32)(gpio_value_file)}
    err = syscall.EpollCtl(epoll_fd, syscall.EPOLL_CTL_ADD, gpio_value_file, &epoll_event)
    if err != nil {
      fmt.Println(os.Stderr, err)
      os.Exit(1)
    }
  }

  fmt.Println("Listening for events..")
  times,errors := produce_events(epoll_fd)
  loop:
  for {
    select {
      case t := <-times:
        fmt.Println(t.Format(time.RFC3339Nano))
      case err = <-errors:
        fmt.Println(os.Stderr, err)
        break loop
    }
  }
}
