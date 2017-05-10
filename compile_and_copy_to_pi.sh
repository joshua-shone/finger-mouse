set -e
env GOOS=linux GOARCH=arm go build
scp finger-mouse 192.168.1.55:~
