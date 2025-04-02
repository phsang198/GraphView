# Network Graph Visualization

## Running the Web Server

There are several ways to run a local web server for this application:

### Option 1: Python HTTP Server

If you have Python installed:

```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

Then open your browser and go to: http://localhost:8000

### Option 2: Node.js Server

If you have Node.js installed:

```bash
# Run the included server script with default port (8080)
node server.js

# Or specify a custom port
node server.js 3000
```

Then open your browser and go to: http://localhost:[port]

### Option 3: Visual Studio Code with Live Server

1. Install the "Live Server" extension in VS Code
2. Right-click on index.html and select "Open with Live Server"

### Option 4: Using the browser directly

For simple testing, you can open the `index.html` file directly in a browser, but some features may not work properly due to browser security restrictions with local files.

## Stopping the Server

To stop the running server in the terminal:

1. Click on the terminal window where the server is running
2. Press `Ctrl+C` (on Windows, Mac, and Linux)
3. If prompted to terminate the batch job or process, confirm with `Y` and press Enter

## Notes

- A server is needed because browsers restrict certain features when opening files directly from the filesystem
- If you're experiencing CORS issues when loading data, make sure you're using a proper web server
