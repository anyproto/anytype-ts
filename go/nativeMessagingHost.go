/* 
- This is the native messaging host for the AnyType browser extension.
- It enables the web extension to find the open ports of the AnyType application and to start it if it is not running.
- It is installed by the Electron script found in electron/js/lib/installNativeMessagingHost.js
- for more docs, checkout the webclipper repository: https://github.com/anytypeio/webclipper
*/

package main

import (
	"bufio"
	"bytes"
	"encoding/binary"
	"encoding/json"
	"errors"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"unsafe"
)


// UTILITY FUNCTIONS

// splits stdout into an array of lines, removing empty lines
func splitStdOutLines(stdout string) []string {
	lines := strings.Split(stdout, "\n")
	filteredLines := make([]string, 0)
	for _, line := range lines {
		if len(line) > 0 {
			filteredLines = append(filteredLines, line)
		}
	}
	return filteredLines
}

// splits stdout into an array of tokens, replacing tabs with spaces
func splitStdOutTokens(line string) []string {
	return strings.Fields(strings.Replace(line, "\t", " ", -1))
}

// executes a command and returns the stdout as string
func execCommand(command string) (string, error) {
	stdout, err := exec.Command("bash", "-c", command).Output()
	return string(stdout), err
}

// checks if a string is contained in an array of strings
func contains(s []string, e string) bool {
	for _, a := range s {
		if a == e {
			return true
		}
	}
	return false
}

// CORE LOGIC

// Windows: returns a list of open ports for all instances of anytypeHelper.exe found using cli utilities tasklist, netstat and findstr
func getOpenPortsWindows() (map[string][]string, error) {
	appName := "anytypeHelper.exe"
	stdout, err := execCommand(`tasklist | findstr "` + appName + `"`)
	if err != nil {
		return nil, err
	}

	lines := splitStdOutLines(stdout)
	pids := map[string]bool{}
	for _, line := range lines {
		tokens := splitStdOutTokens(line)
		pids[tokens[1]] = true
	}

	if len(pids) == 0 {
		return nil, errors.New("application not running")
	}

	result := map[string][]string{}
	for pid := range pids {
		stdout, err := execCommand(`netstat -ano | findstr ${pid} | findstr LISTENING`)
		if err != nil {
			return nil, err
		}

		lines := splitStdOutLines(stdout)
		ports := map[string]bool{}
		for _, line := range lines {
			tokens := splitStdOutTokens(line)
			port := strings.Split(tokens[1], ":")[1]
			ports[port] = true
		}

		portsSlice := []string{}
		for port := range ports {
			portsSlice = append(portsSlice, port)
		}

		result[pid] = portsSlice
	}

	return result, nil
}

// MacOS and Linux: returns a list of all open ports for all instances of anytype found using cli utilities lsof and grep
func getOpenPortsUnix() (map[string][]string, error) {
	// execute the command
	appName := "anytype"
	stdout, err := execCommand(`lsof -i -P -n | grep LISTEN | grep "` + appName + `"`)
	Trace.Print(`lsof -i -P -n | grep LISTEN | grep "` + appName + `"`)
	if err != nil {
		Trace.Print(err)
		return nil, err
	}
	// initialize the result map
	result := make(map[string][]string)
	// split the output into lines
	lines := splitStdOutLines(stdout)
	for _, line := range lines {

		// normalize whitespace and split into tokens
		tokens := splitStdOutTokens(line)
		pid := tokens[1]
		port := strings.Split(tokens[8], ":")[1]

		// add the port to the result map
		if _, ok := result[pid]; !ok {
			result[pid] = []string{}
		}

		if !contains(result[pid], port) {
			result[pid] = append(result[pid], port)
		}
	}

	if len(result) == 0 {
		return nil, errors.New("application not running")
	}

	return result, nil
}

// Windows, MacOS and Linux: returns a list of all open ports for all instances of anytype found using cli utilities
func getOpenPorts() (map[string][]string, error) {
	// Get Platform
	platform := runtime.GOOS

	Trace.Print("Getting Open Ports on Platform: " + platform)

	// Platform specific functions
	if platform == "windows" {
		return getOpenPortsWindows()
	} else if platform == "darwin" {
		return getOpenPortsUnix()
	} else if platform == "linux" {
		return getOpenPortsUnix()
	} else {
		return nil, errors.New("unsupported platform")
	}
}

// Windows, MacOS and Linux: Starts AnyType as a detached process and returns the PID
func startApplication() (int, error) {
	platform := runtime.GOOS
	executablePath, err := os.Executable()
	if err != nil {
		return 0, err
	}
	// /Resources/app.asar.unpacked/dist/executable
	appPath := filepath.Dir(filepath.Dir(filepath.Dir(filepath.Dir(executablePath))))
	if platform == "windows" {
		appPath = filepath.Join(appPath, "Anytype.exe")
	} else if platform == "darwin" {
		appPath = filepath.Join(appPath, "MacOS", "Anytype")
	} else if platform == "linux" {
		appPath = filepath.Join(appPath, "anytype")
	} else {
		return 0, errors.New("unsupported platform")
	}
	Trace.Print("Starting Application on Platform: " + platform + " with Path: " + appPath)
	sub := exec.Command(appPath)
	err = sub.Start()
	sub.Process.Release()

	if err != nil {
		return 0, err
	}

	return sub.Process.Pid, nil
}

// MESSAGING LOGIC

// constants for Logger
var (
	// Trace logs general information messages.
	Trace *log.Logger
	// Error logs error messages.
	Error *log.Logger
)

// nativeEndian used to detect native byte order
var nativeEndian binary.ByteOrder

// bufferSize used to set size of IO buffer - adjust to accommodate message payloads
var bufferSize = 8192

// IncomingMessage represents a message sent to the native host.
type IncomingMessage struct {
	Type string `json:"type"`
}

// OutgoingMessage respresents a response to an incoming message query.
type OutgoingMessage struct {
	Type     string      `json:"type"`
	Response interface{} `json:"response"`
	Error    interface{} `json:"error"`
}

// Init initializes logger and determines native byte order.
func Init(traceHandle io.Writer, errorHandle io.Writer) {
	Trace = log.New(traceHandle, "TRACE: ", log.Ldate|log.Ltime|log.Lshortfile)
	Error = log.New(errorHandle, "ERROR: ", log.Ldate|log.Ltime|log.Lshortfile)

	// determine native byte order so that we can read message size correctly
	var one int16 = 1
	b := (*byte)(unsafe.Pointer(&one))
	if *b == 0 {
		nativeEndian = binary.BigEndian
	} else {
		nativeEndian = binary.LittleEndian
	}
}

func main() {
	file, err := os.OpenFile("nmh.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		Init(os.Stdout, os.Stderr)
		Error.Printf("Unable to create and/or open log file. Will log to Stdout and Stderr. Error: %v", err)
	} else {
		Init(file, file)
		// ensure we close the log file when we're done
		defer file.Close()
	}

	Trace.Printf("Chrome native messaging host started. Native byte order: %v.", nativeEndian)
	read()
	Trace.Print("Chrome native messaging host exited.")
}

// read Creates a new buffered I/O reader and reads messages from Stdin.
func read() {
	v := bufio.NewReader(os.Stdin)
	// adjust buffer size to accommodate your json payload size limits; default is 4096
	s := bufio.NewReaderSize(v, bufferSize)
	Trace.Printf("IO buffer reader created with buffer size of %v.", s.Size())

	lengthBytes := make([]byte, 4)
	lengthNum := int(0)

	// we're going to indefinitely read the first 4 bytes in buffer, which gives us the message length.
	// if stdIn is closed we'll exit the loop and shut down host
	for b, err := s.Read(lengthBytes); b > 0 && err == nil; b, err = s.Read(lengthBytes) {
		// convert message length bytes to integer value
		lengthNum = readMessageLength(lengthBytes)
		Trace.Printf("Message size in bytes: %v", lengthNum)

		// If message length exceeds size of buffer, the message will be truncated.
		// This will likely cause an error when we attempt to unmarshal message to JSON.
		if lengthNum > bufferSize {
			Error.Printf("Message size of %d exceeds buffer size of %d. Message will be truncated and is unlikely to unmarshal to JSON.", lengthNum, bufferSize)
		}

		// read the content of the message from buffer
		content := make([]byte, lengthNum)
		_, err := s.Read(content)
		if err != nil && err != io.EOF {
			Error.Fatal(err)
		}

		// message has been read, now parse and process
		parseMessage(content)
	}

	Trace.Print("Stdin closed.")
}

// readMessageLength reads and returns the message length value in native byte order.
func readMessageLength(msg []byte) int {
	var length uint32
	buf := bytes.NewBuffer(msg)
	err := binary.Read(buf, nativeEndian, &length)
	if err != nil {
		Error.Printf("Unable to read bytes representing message length: %v", err)
	}
	return int(length)
}

// parseMessage parses incoming message
func parseMessage(msg []byte) {
	iMsg := decodeMessage(msg)
	Trace.Printf("Message received: %s", msg)

	// start building outgoing json message
	oMsg := OutgoingMessage{
		Type: iMsg.Type,
	}

	switch iMsg.Type {
	case "getPorts":

		// Get open ports
		openPorts, err := getOpenPorts()
		if err != nil {
			oMsg.Error = err.Error()
		} else {
			oMsg.Response = openPorts
		}
	case "launchApp":
		// Start application
		pid, err := startApplication()
		if err != nil {
			oMsg.Error = err.Error()
		} else {
			oMsg.Response = pid
		}
	}

	send(oMsg)
}

// decodeMessage unmarshals incoming json request and returns query value.
func decodeMessage(msg []byte) IncomingMessage {
	var iMsg IncomingMessage
	err := json.Unmarshal(msg, &iMsg)
	if err != nil {
		Error.Printf("Unable to unmarshal json to struct: %v", err)
	}
	return iMsg
}

// send sends an OutgoingMessage to os.Stdout.
func send(msg OutgoingMessage) {
	byteMsg := dataToBytes(msg)
	writeMessageLength(byteMsg)

	var msgBuf bytes.Buffer
	_, err := msgBuf.Write(byteMsg)
	if err != nil {
		Error.Printf("Unable to write message length to message buffer: %v", err)
	}

	_, err = msgBuf.WriteTo(os.Stdout)
	if err != nil {
		Error.Printf("Unable to write message buffer to Stdout: %v", err)
	}
}

// dataToBytes marshals OutgoingMessage struct to slice of bytes
func dataToBytes(msg OutgoingMessage) []byte {
	byteMsg, err := json.Marshal(msg)
	if err != nil {
		Error.Printf("Unable to marshal OutgoingMessage struct to slice of bytes: %v", err)
	}
	return byteMsg
}

// writeMessageLength determines length of message and writes it to os.Stdout.
func writeMessageLength(msg []byte) {
	err := binary.Write(os.Stdout, nativeEndian, uint32(len(msg)))
	if err != nil {
		Error.Printf("Unable to write message length to Stdout: %v", err)
	}
}
