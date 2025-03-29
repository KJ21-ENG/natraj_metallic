const { SerialPort } = require('serialport');
const EventEmitter = require('events');
const os = require('os');

class WeightScaleService extends EventEmitter {
  constructor() {
    super();
    this.port = null;
    this.buffer = '';
    this.isConnected = false;
    this.defaultPort = os.platform() === 'win32' ? 'COM3' : '/dev/tty.usbserial';
    this.defaultBaudRate = 2400;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
  }

  async initialize(options = {}) {
    try {
      const portPath = options.port || this.defaultPort;
      const baudRate = options.baudRate || this.defaultBaudRate;
      
      // Close existing connection if any
      await this.disconnect();
      
      console.log(`Attempting to connect to weight scale on ${portPath} at ${baudRate} baud...`);
      
      this.port = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        dataBits: 8,
        parity: 'none',
        stopBits: 1,
        autoOpen: false
      });

      return new Promise((resolve, reject) => {
        this.port.open((err) => {
          if (err) {
            console.error('Failed to open serial port:', err);
            this.isConnected = false;
            reject(err);
            return;
          }

          console.log('Connected to weight scale');
          this.isConnected = true;
          
          this.port.on('data', (data) => {
            this.handleData(data);
          });
          
          this.port.on('error', (err) => {
            console.error('Serial port error:', err);
            this.emit('error', err);
          });
          
          this.port.on('close', () => {
            console.log('Serial port closed');
            this.isConnected = false;
            this.emit('disconnected');
          });
          
          resolve(true);
        });
      });
    } catch (error) {
      console.error('Error initializing weight scale:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async autoDetectAndConnect() {
    console.log('Attempting to auto-detect weight scale...');
    
    try {
      // Get all available ports
      const ports = await SerialPort.list();
      console.log('Available ports:', ports);
      
      if (ports.length === 0) {
        throw new Error('No serial ports found');
      }

      // Reset connection attempts counter
      this.connectionAttempts = 0;
      
      // Try to connect to each port
      for (const portInfo of ports) {
        // Skip ports that don't match typical scale port patterns
        if (!this.isLikelyScalePort(portInfo)) {
          continue;
        }
        
        try {
          console.log(`Trying port ${portInfo.path}...`);
          
          await this.disconnect(); // Ensure previous connection is closed

          // Create new port instance with standard weight scale settings
          this.port = new SerialPort({
            path: portInfo.path,
            baudRate: this.defaultBaudRate,
            dataBits: 8,
            parity: 'none',
            stopBits: 1,
            autoOpen: false
          });
          
          // Try to connect to this port
          const connected = await this.tryConnect(portInfo.path);
          if (connected) {
            console.log(`Successfully connected to weight scale on port ${portInfo.path}`);
            return true;
          }
        } catch (portError) {
          console.log(`Connection to port ${portInfo.path} failed:`, portError.message);
          continue; // Try the next port
        }
      }
      
      throw new Error('Could not detect and connect to the weight scale on any port');
    } catch (error) {
      console.error('Auto-detection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  isLikelyScalePort(portInfo) {
    const platform = os.platform();
    
    // Different filtering criteria based on platform
    if (platform === 'win32') {
      // On Windows, weight scales typically use COM ports
      return portInfo.path.startsWith('COM');
    } else if (platform === 'darwin') {
      // On macOS, weight scales typically use tty.usbserial or tty.usbmodem
      return (
        portInfo.path.includes('usbserial') || 
        portInfo.path.includes('usbmodem') ||
        portInfo.path.includes('Bluetooth-Incoming-Port')
      );
    } else {
      // On Linux and other platforms, look for ttyUSB or ttyACM
      return (
        portInfo.path.includes('ttyUSB') || 
        portInfo.path.includes('ttyACM')
      );
    }
  }

  async tryConnect(portPath) {
    this.connectionAttempts++;
    
    return new Promise((resolve, reject) => {
      this.port.open((err) => {
        if (err) {
          reject(err);
          return;
        }
        
        // Set a timeout for weight data detection
        const dataTimeout = setTimeout(() => {
          // If we haven't received any data that looks like a weight reading,
          // close the port and try the next one
          if (this.port && this.port.isOpen) {
            this.port.close();
          }
          this.isConnected = false;
          reject(new Error('No weight data detected from this port'));
        }, 2000); // 2 second timeout
        
        // Listen for data and look for weight format
        const onData = (data) => {
          this.buffer += data.toString('utf8');
          
          // Check if the data matches the expected weight scale format
          if (this.buffer.includes('[') && this.buffer.includes(']')) {
            const { weights } = this.processBuffer(this.buffer);
            if (weights.length > 0) {
              // Looks like we found a weight scale!
              clearTimeout(dataTimeout);
              this.port.removeListener('data', onData);
              
              // Setup normal event handlers
              this.port.on('data', (data) => this.handleData(data));
              this.port.on('error', (err) => {
                console.error('Serial port error:', err);
                this.emit('error', err);
              });
              this.port.on('close', () => {
                console.log('Serial port closed');
                this.isConnected = false;
                this.emit('disconnected');
              });
              
              this.isConnected = true;
              resolve(true);
            }
          }
        };
        
        this.port.on('data', onData);
        
        // Also handle errors and closing
        const onError = (err) => {
          clearTimeout(dataTimeout);
          this.port.removeListener('data', onData);
          this.port.removeListener('error', onError);
          this.port.removeListener('close', onClose);
          reject(err);
        };
        
        const onClose = () => {
          clearTimeout(dataTimeout);
          this.port.removeListener('data', onData);
          this.port.removeListener('error', onError);
          this.port.removeListener('close', onClose);
          reject(new Error('Port closed unexpectedly'));
        };
        
        this.port.on('error', onError);
        this.port.on('close', onClose);
      });
    });
  }

  handleData(data) {
    // Convert Buffer to string and add to existing buffer
    this.buffer += data.toString('utf8');
    
    // Process buffer and extract weight readings
    const { weights, remainingBuffer } = this.processBuffer(this.buffer);
    this.buffer = remainingBuffer;
    
    if (weights.length > 0) {
      // Emit the last weight value
      this.emit('weight', weights[weights.length - 1]);
    }
  }

  processBuffer(buffer) {
    const weights = [];
    let remainingBuffer = buffer;
    
    // Look for patterns like [12345] where 12345 represents weight in grams
    while (true) {
      const startIdx = remainingBuffer.indexOf('[');
      if (startIdx === -1) break;
      
      const endIdx = remainingBuffer.indexOf(']', startIdx);
      if (endIdx === -1) break;
      
      const reading = remainingBuffer.substring(startIdx + 1, endIdx);
      remainingBuffer = remainingBuffer.substring(endIdx + 1);
      
      // Process reading - if it's a 5-digit number, convert to weight in kg
      if (/^\d{5}$/.test(reading)) {
        const weight = parseInt(reading, 10) / 100; // Convert to kg
        weights.push(weight);
      }
    }
    
    return { weights, remainingBuffer };
  }

  async captureWeight() {
    if (!this.isConnected) {
      throw new Error('Weight scale not connected');
    }
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removeListener('weight', onWeight);
        reject(new Error('Timeout waiting for weight reading'));
      }, 5000); // 5 second timeout
      
      const onWeight = (weight) => {
        clearTimeout(timeout);
        this.removeListener('weight', onWeight);
        resolve(weight);
      };
      
      this.once('weight', onWeight);
    });
  }

  async disconnect() {
    if (this.port && this.port.isOpen) {
      return new Promise((resolve) => {
        this.port.close(() => {
          this.isConnected = false;
          console.log('Disconnected from weight scale');
          resolve();
        });
      });
    }
    return Promise.resolve();
  }

  getAvailablePorts() {
    return SerialPort.list();
  }
}

module.exports = new WeightScaleService(); 