set -e
env GOOS=linux GOARCH=arm go build sysfs_gpio.go
scp sysfs_gpio 192.168.1.28:~
