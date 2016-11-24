#!/bin/sh

# this script checks if the mongod is running, starts it if not

if pgrep -q mongod; then
    echo stopping;
    mongod --shutdown;
else
    echo not running;
fi
exit 0;
