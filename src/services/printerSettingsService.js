const fs = require('fs');
const path = require('path');
const { app, BrowserWindow } = require('electron');
const { exec } = require('child_process');
const os = require('os');
//hii
class PrinterSettingsService {
    constructor() {
        this.dataFile = path.join(app.getPath('userData'), 'data', 'printer_settings.json');
        this.initializeDataFile();
    }

    initializeDataFile() {
        if (!fs.existsSync(this.dataFile)) {
            const defaultSettings = {
                labelPrinter: '',
                invoicePrinter: ''
            };
            fs.writeFileSync(this.dataFile, JSON.stringify(defaultSettings, null, 2));
        }
    }

    getSettings() {
        try {
            const data = fs.readFileSync(this.dataFile, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading printer settings:', error);
            return {
                labelPrinter: '',
                invoicePrinter: ''
            };
        }
    }

    updateSettings(settings) {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(settings, null, 2));
            return true;
        } catch (error) {
            console.error('Error updating printer settings:', error);
            return false;
        }
    }

    async getAvailablePrinters() {
        const platform = os.platform();
        
        // Try using different methods based on platform
        if (platform === 'darwin') {
            // macOS
            return this.getMacOSPrinters();
        } else if (platform === 'win32') {
            // Windows
            return this.getWindowsPrinters();
        } else {
            // Linux or other platforms
            return this.getLinuxPrinters();
        }
    }
    
    async getMacOSPrinters() {
        return new Promise((resolve, reject) => {
            exec('lpstat -p | awk \'{print $2}\'', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error getting macOS printers: ${error}`);
                    // Fall back to dummy printers
                    resolve(this.getDummyPrinters());
                    return;
                }
                
                // Parse the output to get printer names
                const printers = stdout.split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => line.trim());
                
                if (printers.length === 0) {
                    console.warn('No printers found on macOS');
                    resolve(this.getDummyPrinters());
                } else {
                    resolve(printers);
                }
            });
        });
    }
    
    async getWindowsPrinters() {
        try {
            // For Windows, try first with Electron's API
            const focusedWindow = BrowserWindow.getFocusedWindow();
            if (focusedWindow) {
                const printers = await focusedWindow.webContents.getPrintersAsync();
                const printerNames = printers.map(printer => printer.name);
                
                if (printerNames.length > 0) {
                    return printerNames;
                }
            }
            
            // Fall back to using wmic
            return new Promise((resolve, reject) => {
                exec('wmic printer list brief', (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error getting Windows printers with wmic: ${error}`);
                        resolve(this.getDummyPrinters());
                        return;
                    }
                    
                    // Parse the output to get printer names
                    const lines = stdout.split('\n');
                    const printers = [];
                    
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line) {
                            const parts = line.split(/\s{2,}/);
                            if (parts.length > 0) {
                                printers.push(parts[0]);
                            }
                        }
                    }
                    
                    if (printers.length === 0) {
                        console.warn('No printers found on Windows with wmic');
                        resolve(this.getDummyPrinters());
                    } else {
                        resolve(printers);
                    }
                });
            });
        } catch (error) {
            console.error(`Error in getWindowsPrinters: ${error}`);
            return this.getDummyPrinters();
        }
    }
    
    async getLinuxPrinters() {
        return new Promise((resolve, reject) => {
            exec('lpstat -a | cut -d \' \' -f1', (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error getting Linux printers: ${error}`);
                    resolve(this.getDummyPrinters());
                    return;
                }
                
                // Parse the output to get printer names
                const printers = stdout.split('\n')
                    .filter(line => line.trim() !== '')
                    .map(line => line.trim());
                
                if (printers.length === 0) {
                    console.warn('No printers found on Linux');
                    resolve(this.getDummyPrinters());
                } else {
                    resolve(printers);
                }
            });
        });
    }
    
    getDummyPrinters() {
        return [
            'Default Printer',
            'PDF Printer',
            'Microsoft Print to PDF',
            'Document Printer'
        ];
    }
}

module.exports = new PrinterSettingsService(); 