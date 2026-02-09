#!/bin/bash

# Get the directory where the script is located
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Run the server using the current python environment
# Method 1: Use 'python' directly, assuming the environment is already activated or inherited
python server.py

