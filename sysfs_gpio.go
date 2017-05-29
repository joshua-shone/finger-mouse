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

func produce_events(epoll_fd int, epoll_event syscall.EpollEvent, events_file int) (chan time.Time, chan error){
  times := make(chan time.Time, 64)
  errors := make(chan error)
  go func() {
    for {
      n,err := syscall.EpollWait(epoll_fd, []syscall.EpollEvent{epoll_event}, -1)
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
      err = consume_event(events_file)
      if err != nil {
        errors <- err
        close(times)
        close(errors)
      }
    }
  }()
  return times,errors
}

func main() {
  // Export GPIO device
  err := ioutil.WriteFile("/sys/class/gpio/export", []byte("21\n"), 0644)
  if err != nil {
    if strings.Contains(err.Error(), "device or resource busy") {
      fmt.Println("GPIO pin already appears to be exported, continuing..")
    } else {
      fmt.Println(os.Stderr, err.Error())
      os.Exit(1)
    }
  } else {
    // HACK: Wait for pin to be exported
    // There doesn't seem to be a good wait to do this. See https://github.com/raspberrypi/linux/issues/553
    time.Sleep(time.Second)
  }

  // Set edge interrupt mode
  err = ioutil.WriteFile("/sys/class/gpio/gpio21/edge", []byte("both\n"), 0644)
  if err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }

  gpio_value_file,err := syscall.Open("/sys/class/gpio/gpio21/value", syscall.O_RDONLY, 0)
  if err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }
  defer syscall.Close(gpio_value_file)

  err = consume_event(gpio_value_file)
  if err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }

  // Setup EPoll
  epoll_fd,err := syscall.EpollCreate(1)
  if err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }
  epoll_event := syscall.EpollEvent{Events: syscall.EPOLLPRI, Fd: (int32)(gpio_value_file)}
  err = syscall.EpollCtl(epoll_fd, syscall.EPOLL_CTL_ADD, gpio_value_file, &epoll_event)
  if err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }

  fmt.Println("Listening for events..")
  times,errors := produce_events(epoll_fd, epoll_event, gpio_value_file)
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
