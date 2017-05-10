package main

import (
  "github.com/stianeikeland/go-rpio"
  "os"
  "os/signal"
  "fmt"
  "time"
)

func main() {
  if err := rpio.Open(); err != nil {
    fmt.Println(os.Stderr, err)
    os.Exit(1)
  }
  fmt.Println("RPIO Open() successful")
  defer rpio.Close()

  fmt.Println("Setting all pins to input mode")
  for i := rpio.Pin(0); i <= 25; i++ {
    rpio.PinMode(i, rpio.Input)
  }
  
  interruptChan := make(chan os.Signal, 1)
  signal.Notify(interruptChan, os.Interrupt)
  
  tickChan := time.Tick(time.Second * 1)
  
  loop:
  for {
    select {
      case <-tickChan:
        for i := rpio.Pin(0); i <= 25; i++ {
          fmt.Printf("%d", rpio.ReadPin(i))
        }
        os.Stdout.WriteString("\n")
      case <-interruptChan:
        fmt.Println("Interrupt signal received")
        break loop
    }
  }
}
