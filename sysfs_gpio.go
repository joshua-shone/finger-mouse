package main

import (
  "fmt"
//   "time"
  "os"
  "io/ioutil"
  "syscall"
)

func FD_SET(p *syscall.FdSet, i int) {
  p.Bits[i/64] |= 1 << uint(i) % 64
}
func FD_ISSET(p *syscall.FdSet, i int) bool {
  return (p.Bits[i/64] & (1 << uint(i) % 64)) != 0
}
func FD_ZERO(p *syscall.FdSet) {
  for i := range p.Bits {
    p.Bits[i] = 0
  }
}

func main() {
  // Export GPIO device
//   err := ioutil.WriteFile("/sys/class/gpio/export", []byte("21\n"), 0644)
//   if err != nil {
//     fmt.Println(os.Stderr, err)
//     os.Exit(1)
//   }
// 
//   // HACK: Wait for pin to be exported
//   time.Sleep(time.Second)

  // Set edge interrupt mode
  err := ioutil.WriteFile("/sys/class/gpio/gpio21/edge", []byte("both\n"), 0644)
  if err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }

  gpio_value_file,err := os.Open("/sys/class/gpio/gpio21/value")
  if err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }

  gpio_value := make([]byte, 1)
  bytes_read,err := gpio_value_file.Read(gpio_value)
  if err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }
  if bytes_read != 1 {
    fmt.Println("Incorrect number of bytes read");
    os.Exit(1)
  }
  fmt.Printf("Value: %s\n", gpio_value)

  file_descriptors := &syscall.FdSet{}
  timeout := &syscall.Timeval{}
  timeout.Sec, timeout.Usec = 5,0
  FD_ZERO(file_descriptors)
  FD_SET(file_descriptors, (int)(gpio_value_file.Fd()))
  n,err := syscall.Select((int)(gpio_value_file.Fd()) + 1, nil, nil, file_descriptors, timeout)
  if err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }
  if n > 0 {
    fmt.Println("Event detected!")
  } else {
    fmt.Println("No event detected..")
  }
}