# Natraj Metallic - Yarn Management System

An Electron-based desktop application for managing yarn production workflow, from inbound rolls to final dispatch.

## Features

- **Inbound Management**: Record new rolls arriving from customers
- **Issue to Machine**: Track rolls issued to production machines
- **Receive from Machine**: Record finished boxes produced from rolls
- **Dispatch Management**: Create dispatch notes and track shipped boxes
- **Reports**: Generate stock, production, and dispatch reports
- **Label Printing**: Print box labels and dispatch notes
- **Data Storage**: Simple CSV-based data storage with automatic backups

## System Requirements

- Windows 10 or later
- 4GB RAM
- 500MB free disk space

## Installation

### Development Setup

1. Clone this repository
   ```
   git clone https://github.com/your-repo/natraj-metallic.git
   cd natraj-metallic
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Run the application in development mode
   ```
   npm run dev
   ```

### Production Build

To create a production build:

1. Run the build command
   ```
   npm run build
   ```

2. The executable will be available in the `dist` folder

## Usage Guide

### Inbound Screen

1. Enter customer name, color/type, weight, lot number, and date received
2. Click "Save Roll" to record the new roll in stock

### Issue to Machine Screen

1. Select a roll from the dropdown menu
2. Enter operator name, cut information, and issue date
3. Click "Issue to Machine" to update the roll's status

### Receive from Machine Screen

1. Select a roll that's currently on a machine
2. Enter box details: gross weight, tare weight, bobbin count, and bobbin type
3. Click "Add Box" to add the box to the list
4. Check "Pending is Wastage" if any leftover weight should be marked as waste
5. Click "Save & Print Labels" to finalize and print box labels

### Dispatch Screen

1. Scan box IDs or select from available boxes
2. Review the dispatch cart and total weights/counts
3. Enter customer name for the dispatch
4. Click "Confirm Dispatch" to create a dispatch note and mark boxes as dispatched

## Data Storage

All data is stored in CSV files in the application's user data directory:
- `rolls.csv`: Tracks all rolls and their current status
- `goods_on_machine.csv`: Records rolls issued to machines
- `boxes.csv`: Contains all box information
- `dispatches.csv`: Records all dispatches

A backup of all CSV files is created automatically each time the application is started.

## Troubleshooting

If you encounter any issues:

1. Check that the application has proper permissions to read/write to the user data directory
2. If data appears corrupted, restore from a backup in the `backups` folder
3. Contact support for further assistance

## License

This software is proprietary and confidential. Unauthorized copying, distribution, or use is prohibited.

---

© 2023 Natraj Metallic. All rights reserved. 