package main

import (
  "strings"
  "fmt"
  "time"
  "os"
  "io/ioutil"
  "syscall"
)

func main() {
  // Export GPIO device
  err := ioutil.WriteFile("/sys/class/gpio/export", []byte("21\n"), 0644)
  if strings.Contains(err.Error(), "device or resource busy") {
    fmt.Println("GPIO pin already appears to be exported, continuing..")
  } else if err != nil {
    fmt.Println(os.Stderr, err.Error())
    os.Exit(1)
  } else {
    // HACK: Wait for pin to be exported
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

  // Consume any prior interrupt
  gpio_value := make([]byte, 64)
  _,err = syscall.Read(gpio_value_file, gpio_value)
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

  event_count := 0

  fmt.Println("Listening for events..")
  for {
    n,err := syscall.EpollWait(epoll_fd, []syscall.EpollEvent{epoll_event}, 5000)
    if err != nil {
      fmt.Println(os.Stderr, err)
      os.Exit(1)
    }
    if n >= 1 {
      fmt.Printf("Event detected! #%d\n", event_count)
      event_count += 1
    }

    // Consume interrupt
    _,err = syscall.Seek(gpio_value_file, 0, 0)
    if err != nil {
      fmt.Println(os.Stderr, err)
      os.Exit(1)
    }
    _,err = syscall.Read(gpio_value_file, gpio_value)
    if err != nil {
      fmt.Println(os.Stderr, err)
      os.Exit(1)
    }
  }
}