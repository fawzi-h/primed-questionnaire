// Initialize an empty array to store logs before sending them to the server
let logBuffer = [];

// Set a limit on how many logs can be buffered before automatically sending them
const bufferLimit = 10;

// Define how often (in milliseconds) the buffer should be flushed (sent to the server)
const flushInterval = 5000;

/**
 * Function to send buffered logs to the server.
 * - It checks if there are any logs in the buffer, and if so, sends them.
 * - Logs are sent using a POST request to the '/api/logs' endpoint.
 * - After successful transmission, the buffer is cleared.
 * - If an error occurs during the fetch, it catches the error and logs it to the console.
 */
const sendBufferedLogs = async () => {
  if (logBuffer.length === 0) return;

  try {
    // await fetch("/api/logs", {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify(logBuffer),
    // });
    // Clear the log buffer after successfully sending the logs
    logBuffer = [];
  } catch (error) {
    console.error("Error sending buffered logs to server", error);
  }
};

/**
 * Function to add a new log entry to the buffer and send logs if the buffer limit is reached.
 * - logType: Type or category of the log (e.g., 'error', 'info').
 * - message: Log message or description.
 * - additionalData: (optional) Any additional data to include with the log.
 */

export const logToServer = (logType, message, additionalData = {}) => {
  const logData = {
    logType,
    message,
    additionalData,
    timestamp: new Date().toISOString(),
    url: window.location.href,
  };

  logBuffer.push(logData);

  if (logBuffer.length >= bufferLimit) {
    sendBufferedLogs();
  }
};

// Set up a recurring interval to send buffered logs every 'flushInterval' milliseconds (5 seconds)
setInterval(sendBufferedLogs, flushInterval);
