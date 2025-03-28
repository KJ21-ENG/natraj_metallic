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
            // For Windows, use PowerShell to get all printers with their status
            return new Promise((resolve, reject) => {
                // PowerShell command to get all printers with their status
                const command = 'powershell.exe -Command "Get-Printer | Select-Object Name, PrinterStatus, WorkOffline | ConvertTo-Json"';
                
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error getting Windows printers: ${error}`);
                        // Try alternative method using wmic
                        exec('wmic printer get Name,PrinterStatus,WorkOffline /format:csv', (wmicError, wmicStdout, wmicStderr) => {
                            if (wmicError) {
                                console.error(`Error getting Windows printers with wmic: ${wmicError}`);
                                resolve(this.getDummyPrintersWithStatus());
                                return;
                            }
                            
                            // Parse wmic CSV output
                            const lines = wmicStdout.split('\n')
                                .map(line => line.trim())
                                .filter(line => line.length > 0);
                            
                            if (lines.length <= 1) {
                                console.warn('No printers found on Windows');
                                resolve(this.getDummyPrintersWithStatus());
                                return;
                            }

                            // Skip header row and process printer data
                            const printers = [];
                            for (let i = 1; i < lines.length; i++) {
                                const [name, status, offline] = lines[i].split(',');
                                if (name && name !== 'Name') {
                                    printers.push({
                                        name: name,
                                        isActive: status === '3' && offline.toLowerCase() === 'false'
                                    });
                                }
                            }
                            
                            // Sort printers: active first, then inactive
                            printers.sort((a, b) => {
                                if (a.isActive === b.isActive) return a.name.localeCompare(b.name);
                                return a.isActive ? -1 : 1;
                            });
                            
                            resolve(printers);
                        });
                        return;
                    }
                    
                    try {
                        // Parse PowerShell JSON output
                        const printersData = JSON.parse(stdout);
                        const printers = (Array.isArray(printersData) ? printersData : [printersData])
                            .map(printer => ({
                                name: printer.Name,
                                isActive: printer.PrinterStatus === 'Normal' && !printer.WorkOffline
                            }));
                        
                        // Sort printers: active first, then inactive
                        printers.sort((a, b) => {
                            if (a.isActive === b.isActive) return a.name.localeCompare(b.name);
                            return a.isActive ? -1 : 1;
                        });
                        
                        resolve(printers);
                    } catch (parseError) {
                        console.error(`Error parsing printer data: ${parseError}`);
                        resolve(this.getDummyPrintersWithStatus());
                    }
                });
            });
        } catch (error) {
            console.error(`Error in getWindowsPrinters: ${error}`);
            return this.getDummyPrintersWithStatus();
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
    
    getDummyPrintersWithStatus() {
        return [
            { name: 'Default Printer', isActive: true },
            { name: 'PDF Printer', isActive: true },
            { name: 'Microsoft Print to PDF', isActive: true },
            { name: 'Disconnected Printer', isActive: false },
            { name: 'Offline Printer', isActive: false }
        ];
    }
    
    // Update the dummy printers method to maintain backward compatibility
    getDummyPrinters() {
        return this.getDummyPrintersWithStatus().map(p => p.name);
    }
}

module.exports = new PrinterSettingsService(); 