// Wait for the DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
  // Navigation handling
  setupNavigation();
  
  // Setup forms and event listeners
  setupInboundTabs();
  setupInboundForm();
  setupBobbinInboundForm();
  setupIssueToMachineScreen();
  setupReceiveFromMachineScreen();
  setupDispatchScreen();
  setupReportsScreen();
  setupPrinterSettings();
  setupPrintTest();
  
  // Initialize the default screen (Inbound)
  document.querySelector('.nav-link[data-screen="inbound"]').classList.add('active');
});

// Setup inbound tabs
function setupInboundTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      
      // Remove active class from all buttons and contents
      tabBtns.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // Add active class to clicked button and corresponding content
      this.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Navigation between screens
function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const screens = document.querySelectorAll('.screen');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      this.classList.add('active');
      
      // Hide all screens
      screens.forEach(screen => screen.classList.add('hidden'));
      
      // Show the selected screen
      const screenId = this.getAttribute('data-screen') + '-screen';
      document.getElementById(screenId).classList.remove('hidden');
      
      // Load data for the selected screen
      loadScreenData(this.getAttribute('data-screen'));
    });
  });
}

// Load data for each screen
function loadScreenData(screenType) {
  switch(screenType) {
    case 'inbound':
      // Load customers for the dropdown
      populateCustomerDropdown('customer-name');
      
      // Set default date to today
      document.getElementById('date-received').value = new Date().toISOString().split('T')[0];
      
      // Load the next lot number
      loadNextLotNumber();
      
      // Load recent lots history
      loadLotsHistory();
      break;
      
    case 'issue-to-machine':
      loadInStockRolls();
      break;
      
    case 'receive-from-machine':
      loadRollsOnMachine();
      // Load bobbin types and box types for dropdowns
      populateBobbinTypeDropdown('bobbin-type-receive');
      populateBoxTypeDropdown('box-type');
      break;
      
    case 'dispatch':
      loadBoxesReadyToDispatch();
      // Load customers for the dropdown
      populateCustomerDropdown('customer-dispatch');
      break;
      
    case 'reports':
      // Initialize report dates to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const formatDate = date => date.toISOString().split('T')[0];
      
      document.getElementById('prod-report-from').value = formatDate(firstDay);
      document.getElementById('prod-report-to').value = formatDate(lastDay);
      document.getElementById('disp-report-from').value = formatDate(firstDay);
      document.getElementById('disp-report-to').value = formatDate(lastDay);
      break;
      
    case 'masters':
      loadCustomers();
      setupMastersTabs();
      break;
  }
}

// Inbound Screen Functions
function setupInboundForm() {
  const rollForm = document.getElementById('roll-form');
  const addRollBtn = document.getElementById('add-roll-btn');
  const resetRollBtn = document.getElementById('reset-roll-btn');
  const saveLotBtn = document.getElementById('save-lot-btn');
  const addedRollsContainer = document.getElementById('added-rolls-container');
  const addedRollsTable = document.getElementById('added-rolls-table').querySelector('tbody');
  
  // Array to store rolls for the current lot
  let currentLotRolls = [];
  
  // Set default date to today
  document.getElementById('date-received').value = new Date().toISOString().split('T')[0];
  
  // Add roll button click
  addRollBtn.addEventListener('click', function() {
    const customerName = document.getElementById('customer-name').value;
    const colorType = document.getElementById('color-type').value;
    const weight = parseFloat(document.getElementById('weight').value);
    
    // Validate inputs
    if (!customerName) {
      alert('Please select a customer.');
      return;
    }
    
    if (!colorType) {
      alert('Please enter a color/type.');
      return;
    }
    
    if (isNaN(weight) || weight <= 0) {
      alert('Please enter a valid weight.');
      return;
    }
    
    // Create roll data object
    const rollData = {
      customer_name: customerName,
      color_or_type: colorType,
      weight: weight,
      date_received: document.getElementById('date-received').value
    };
    
    // Add to the current lot rolls array
    currentLotRolls.push(rollData);
    
    // Add to the table
    const nextSeqNum = currentLotRolls.length;
    const lotNumber = document.getElementById('lot-number').value;
    const tempRollId = `${lotNumber}-${nextSeqNum}`;
    
    const row = document.createElement('tr');
    row.setAttribute('data-index', nextSeqNum - 1);
    row.innerHTML = `
      <td>${tempRollId}</td>
      <td>${rollData.customer_name}</td>
      <td>${rollData.color_or_type}</td>
      <td>${rollData.weight.toFixed(2)}</td>
      <td>
        <button type="button" class="btn-delete remove-roll" data-index="${nextSeqNum - 1}">Remove</button>
      </td>
    `;
    
    addedRollsTable.appendChild(row);
    addedRollsContainer.classList.remove('hidden');
    
    // Reset the form for the next roll
    document.getElementById('color-type').value = '';
    document.getElementById('weight').value = '';
    document.getElementById('color-type').focus();
  });
  
  // Reset roll form button click
  resetRollBtn.addEventListener('click', function() {
    document.getElementById('customer-name').selectedIndex = 0;
    document.getElementById('color-type').value = '';
    document.getElementById('weight').value = '';
  });
  
  // Remove roll button click (event delegation)
  addedRollsTable.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-roll')) {
      const index = parseInt(e.target.getAttribute('data-index'));
      
      // Remove from the array
      currentLotRolls.splice(index, 1);
      
      // Rebuild the table to update indexes
      rebuildRollsTable(currentLotRolls);
      
      // Hide the container if no rolls left
      if (currentLotRolls.length === 0) {
        addedRollsContainer.classList.add('hidden');
      }
    }
  });
  
  // Save lot button click
  saveLotBtn.addEventListener('click', function() {
    if (currentLotRolls.length === 0) {
      alert('Please add at least one roll to the lot.');
      return;
    }
    
    const lotNumber = document.getElementById('lot-number').value;
    const dateReceived = document.getElementById('date-received').value;
    
    // Create lot data
    const lotData = {
      lot_number: lotNumber,
      date_received: dateReceived
    };
    
    // Save the lot and all its rolls
    window.api.createLot(lotData, currentLotRolls)
      .then(response => {
        alert(`Lot ${lotNumber} with ${currentLotRolls.length} rolls created successfully!`);
        
        // Reset everything for the next lot
        currentLotRolls = [];
        addedRollsTable.innerHTML = '';
        addedRollsContainer.classList.add('hidden');
        document.getElementById('customer-name').selectedIndex = 0;
        document.getElementById('color-type').value = '';
        document.getElementById('weight').value = '';
        
        // Get the next lot number
        loadNextLotNumber();
        
        // Reload the lots history
        loadLotsHistory();
      })
      .catch(error => {
        alert('Error creating lot: ' + error);
      });
  });
  
  // Helper function to rebuild the rolls table
  function rebuildRollsTable(rolls) {
    const lotNumber = document.getElementById('lot-number').value;
    
    // Clear the table
    addedRollsTable.innerHTML = '';
    
    // Rebuild with new indexes
    rolls.forEach((roll, index) => {
      const tempRollId = `${lotNumber}-${index + 1}`;
      
      const row = document.createElement('tr');
      row.setAttribute('data-index', index);
      row.innerHTML = `
        <td>${tempRollId}</td>
        <td>${roll.customer_name}</td>
        <td>${roll.color_or_type}</td>
        <td>${parseFloat(roll.weight).toFixed(2)}</td>
        <td>
          <button type="button" class="btn-delete remove-roll" data-index="${index}">Remove</button>
        </td>
      `;
      
      addedRollsTable.appendChild(row);
    });
  }
}

// Load the next lot number
function loadNextLotNumber() {
  window.api.getNextLotNumber()
    .then(lotNumber => {
      document.getElementById('lot-number').value = lotNumber;
    })
    .catch(error => {
      console.error('Error getting next lot number:', error);
    });
}

// Load lots history
function loadLotsHistory() {
  const lotsHistoryTable = document.getElementById('lots-history-table').querySelector('tbody');
  lotsHistoryTable.innerHTML = '';
  
  window.api.getLots()
    .then(lots => {
      // Sort lots by lot number in descending order (newest first)
      lots.sort((a, b) => parseInt(b.lot_number) - parseInt(a.lot_number));
      
      // Take the most recent 10 lots
      const recentLots = lots.slice(0, 10);
      
      if (recentLots.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">No lots found.</td>';
        lotsHistoryTable.appendChild(row);
        return;
      }
      
      recentLots.forEach(lot => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${lot.lot_number}</td>
          <td>${lot.date_received}</td>
          <td>${lot.total_rolls}</td>
          <td>${parseFloat(lot.total_weight).toFixed(2)}</td>
          <td>
            <button type="button" class="btn-view view-lot-details" data-lot="${lot.lot_number}">View Details</button>
            <button type="button" class="btn-delete delete-lot" data-lot="${lot.lot_number}">Delete</button>
          </td>
        `;
        lotsHistoryTable.appendChild(row);
      });
      
      // Add event listeners for view details and delete buttons
      document.querySelectorAll('.view-lot-details').forEach(button => {
        button.addEventListener('click', function() {
          const lotNumber = this.getAttribute('data-lot');
          viewLotDetails(lotNumber);
        });
      });
      
      document.querySelectorAll('.delete-lot').forEach(button => {
        button.addEventListener('click', function() {
          const lotNumber = this.getAttribute('data-lot');
          if (confirm(`Are you sure you want to delete Lot ${lotNumber}? This will delete all rolls in this lot.`)) {
            deleteLot(lotNumber);
          }
        });
      });
    })
    .catch(error => {
      console.error('Error loading lots history:', error);
      lotsHistoryTable.innerHTML = `<tr><td colspan="5" class="text-center">Error loading lots: ${error}</td></tr>`;
    });
}

// View lot details
function viewLotDetails(lotNumber) {
  const modal = document.getElementById('lot-details-modal');
  const modalTitle = document.getElementById('modal-title');
  const lotSummary = document.getElementById('lot-summary');
  const rollsTable = document.getElementById('lot-rolls-table').querySelector('tbody');
  const totalWeightCell = document.getElementById('lot-total-weight');
  
  // First get all rolls in the lot
  window.api.getRollsByLot(lotNumber)
    .then(rolls => {
      // Next get all goods on machine to calculate pending weights
      return Promise.all([
        Promise.resolve(rolls),
        window.api.getGoodsOnMachine()
      ]);
    })
    .then(([rolls, goodsOnMachine]) => {
      // Set modal title
      modalTitle.textContent = `Lot ${lotNumber} Details`;
      
      // Calculate totals
      const totalRolls = rolls.length;
      const totalWeight = rolls.reduce((sum, roll) => sum + parseFloat(roll.weight), 0);
      
      // Set lot summary
      lotSummary.innerHTML = `
        <p><strong>Total Rolls:</strong> ${totalRolls}</p>
        <p><strong>Total Weight:</strong> ${totalWeight.toFixed(2)} kg</p>
      `;
      
      // Clear and populate the table
      rollsTable.innerHTML = '';
      
      if (rolls.length > 0) {
        rolls.forEach(roll => {
          // Calculate pending weight based on status and weight received
          let pendingWeight = parseFloat(roll.weight);
          
          // If the roll is issued to a machine or has been processed, calculate the pending weight
          if (roll.status === 'issued_to_machine' || roll.status === 'completed') {
            // Find if this roll is on a machine
            const onMachine = goodsOnMachine.find(g => g.roll_id === roll.roll_id);
            
            if (onMachine) {
              // If weight_received_so_far exists, subtract it from the initial weight
              const weightReceived = parseFloat(onMachine.weight_received_so_far || 0);
              pendingWeight = Math.max(0, pendingWeight - weightReceived);
            }
          } else if (roll.status === 'completed') {
            // If the roll is completed, pending weight is 0
            pendingWeight = 0;
          }
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${roll.roll_id}</td>
            <td>${roll.customer_name}</td>
            <td>${roll.color_or_type}</td>
            <td>${parseFloat(roll.weight).toFixed(2)} kg</td>
            <td>${pendingWeight.toFixed(2)} kg</td>
            <td>${roll.status}</td>
            <td>
              <button type="button" 
                      class="btn-issue" 
                      data-roll-id="${roll.roll_id}"
                      ${roll.status !== 'in_stock' ? 'disabled' : ''}>
                Issue to Machine
              </button>
            </td>
          `;
          rollsTable.appendChild(row);
        });
        
        // Set total weight in footer
        totalWeightCell.textContent = `${totalWeight.toFixed(2)} kg`;
      } else {
        rollsTable.innerHTML = '<tr><td colspan="7" class="text-center">No rolls found in this lot.</td></tr>';
        totalWeightCell.textContent = '0.00 kg';
      }
      
      // Show the modal
      modal.classList.remove('hidden');
      modal.classList.add('show');
      
      // Add event listener for issue to machine buttons
      rollsTable.querySelectorAll('.btn-issue').forEach(button => {
        if (!button.disabled) {
          button.addEventListener('click', function() {
            const rollId = this.getAttribute('data-roll-id');
            issueRollToMachine(rollId);
            modal.classList.remove('show');
            modal.classList.add('hidden');
          });
        }
      });
    })
    .catch(error => {
      console.error('Error loading lot details:', error);
      alert('Error loading lot details: ' + error);
    });
}

// Function to handle issuing roll to machine
function issueRollToMachine(rollId) {
  // Switch to the issue to machine screen
  const issueScreen = document.getElementById('issue-to-machine-screen');
  const rollSelect = document.getElementById('roll-select');
  
  // Show the issue to machine screen
  document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
  issueScreen.classList.remove('hidden');
  
  // Update the active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-screen') === 'issue-to-machine') {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  // Wait for the roll data to be loaded in the dropdown
  window.api.getRolls()
    .then(rolls => {
      // Populate the roll select dropdown if it's empty
      if (rollSelect.options.length <= 1) {
        const inStockRolls = rolls.filter(roll => roll.status === 'in_stock');
        inStockRolls.forEach(roll => {
          const option = document.createElement('option');
          option.value = roll.roll_id;
          option.textContent = `${roll.roll_id} - ${roll.customer_name} - ${roll.color_or_type}`;
          rollSelect.appendChild(option);
        });
      }
      
      // Set the selected roll in the dropdown
      rollSelect.value = rollId;
      
      // Trigger the change event to load roll details
      rollSelect.dispatchEvent(new Event('change'));
      
      // Set today's date in the issue date field
      const issueDateInput = document.getElementById('issue-date');
      if (issueDateInput) {
        issueDateInput.valueAsDate = new Date();
      }
      
      // Focus on the operator name field
      const operatorInput = document.getElementById('operator-name');
      if (operatorInput) {
        operatorInput.focus();
      }
    })
    .catch(error => {
      console.error('Error loading rolls:', error);
      alert('Error loading rolls. Please try again.');
    });
}

// Modal close button handler
document.querySelector('.close-modal').addEventListener('click', function() {
  const modal = document.getElementById('lot-details-modal');
  modal.classList.remove('show');
  modal.classList.add('hidden');
});

// Close modal when clicking outside
document.getElementById('lot-details-modal').addEventListener('click', function(e) {
  if (e.target === this) {
    this.classList.remove('show');
    this.classList.add('hidden');
  }
});

// Delete lot
function deleteLot(lotNumber) {
  window.api.deleteLot(lotNumber)
    .then(() => {
      alert(`Lot ${lotNumber} deleted successfully!`);
      loadLotsHistory();
    })
    .catch(error => {
      console.error('Error deleting lot:', error);
      alert('Error deleting lot: ' + error);
    });
}

// Issue to Machine Screen Functions
function setupIssueToMachineScreen() {
  const rollSelect = document.getElementById('roll-select');
  const selectedRollDetails = document.getElementById('selected-roll-details');
  const issueForm = document.getElementById('issue-form');
  const machineSelect = document.getElementById('machine-number');
  const bobbinTypeSelect = document.getElementById('bobbin-type-issue');
  
  // Set default date to today
  document.getElementById('issue-date').value = new Date().toISOString().split('T')[0];
  
  // Load machines for dropdown
  window.api.getMachines()
    .then(machines => {
      // Clear existing options except the first one
      while (machineSelect.options.length > 1) {
        machineSelect.remove(1);
      }
      
      // Add each machine as an option
      machines.forEach(machine => {
        const option = document.createElement('option');
        option.value = machine.machine_id;
        option.textContent = `${machine.machine_number} - ${machine.description || ''}`;
        machineSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error loading machines:', error);
    });
  
  // Load bobbin types for dropdown
  window.api.getBobbinTypes()
    .then(bobbinTypes => {
      // Clear existing options except the first one
      while (bobbinTypeSelect.options.length > 1) {
        bobbinTypeSelect.remove(1);
      }
      
      // Add each bobbin type as an option
      bobbinTypes.forEach(bobbin => {
        const option = document.createElement('option');
        option.value = bobbin.type_name;
        option.textContent = bobbin.type_name;
        bobbinTypeSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error loading bobbin types:', error);
    });
  
  // Roll selection change
  rollSelect.addEventListener('change', function() {
    const selectedRollId = this.value;
    
    if (!selectedRollId) {
      selectedRollDetails.classList.add('hidden');
      issueForm.classList.add('hidden');
      return;
    }
    
    // Find the selected roll from our data
    window.api.getRolls()
      .then(rolls => {
        const selectedRoll = rolls.find(roll => roll.roll_id === selectedRollId);
        
        if (selectedRoll) {
          // Display roll details
          selectedRollDetails.innerHTML = `
            <p><strong>Roll ID:</strong> ${selectedRoll.roll_id}</p>
            <p><strong>Customer:</strong> ${selectedRoll.customer_name}</p>
            <p><strong>Color/Type:</strong> ${selectedRoll.color_or_type}</p>
            <p><strong>Weight:</strong> ${selectedRoll.weight} kg</p>
            <p><strong>Lot No:</strong> ${selectedRoll.lot_no || 'N/A'}</p>
            <p><strong>Date Received:</strong> ${selectedRoll.date_received}</p>
          `;
          
          selectedRollDetails.classList.remove('hidden');
          issueForm.classList.remove('hidden');
        }
      });
  });
  
  // Issue form submission
  issueForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const issueData = {
      roll_id: rollSelect.value,
      operator: document.getElementById('operator-name').value,
      machine_id: document.getElementById('machine-number').value,
      machine_number: document.getElementById('machine-number').options[document.getElementById('machine-number').selectedIndex].text.split(' - ')[0],
      cut: parseInt(document.getElementById('cut').value),
      bobbin_quantity: parseInt(document.getElementById('bobbin-quantity').value),
      bobbin_type: document.getElementById('bobbin-type-issue').value,
      issued_date: document.getElementById('issue-date').value
    };
    
    // Call API to issue roll to machine
    window.api.issueToMachine(issueData)
      .then(response => {
        alert(`Roll ${issueData.roll_id} issued to machine successfully!`);
        issueForm.reset();
        rollSelect.value = '';
        selectedRollDetails.classList.add('hidden');
        issueForm.classList.add('hidden');
        
        // Reload available rolls and issued rolls
        loadInStockRolls();
        loadIssuedRolls();
      })
      .catch(error => {
        alert('Error issuing roll: ' + error);
      });
  });
}

function loadInStockRolls() {
  const rollSelect = document.getElementById('roll-select');
  
  // Clear existing options except the first one
  while (rollSelect.options.length > 1) {
    rollSelect.remove(1);
  }
  
  // Get rolls in stock
  window.api.getRolls()
    .then(rolls => {
      const inStockRolls = rolls.filter(roll => roll.status === 'in_stock');
      
      // Add options for each roll
      inStockRolls.forEach(roll => {
        const option = document.createElement('option');
        option.value = roll.roll_id;
        option.textContent = `${roll.roll_id} - ${roll.customer_name} - ${roll.color_or_type} (${roll.weight} kg)`;
        rollSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error loading rolls:', error);
    });
    
  // Load issued rolls history
  loadIssuedRolls();
}

// Function to load and display issued rolls
function loadIssuedRolls() {
  const issuedRollsTable = document.getElementById('issued-rolls-table').querySelector('tbody');
  issuedRollsTable.innerHTML = '<tr><td colspan="9" class="text-center">Loading...</td></tr>';
  
  // Get all goods on machine, rolls, and machines data
  Promise.all([
    window.api.getGoodsOnMachine(),
    window.api.getRolls(),
    window.api.getMachines()
  ])
    .then(([goodsOnMachine, rolls, machines]) => {
      if (goodsOnMachine.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="9" class="text-center">No rolls currently issued to machines.</td>';
        issuedRollsTable.appendChild(row);
        return;
      }
      
      // Clear the table first
      issuedRollsTable.innerHTML = '';
      
      // Sort by issue date, most recent first
      // Sort by issue date, most recent first
      goodsOnMachine.sort((a, b) => new Date(b.issued_date) - new Date(a.issued_date));
      
      goodsOnMachine.forEach(item => {
        const roll = rolls.find(r => r.roll_id === item.roll_id);
        if (roll && roll.status === 'issued_to_machine') {
          // Find machine details if machine_id is available
          let machineDisplay = item.machine_number || 'N/A';
          if (item.machine_id) {
            const machine = machines.find(m => m.machine_id === item.machine_id);
            if (machine) {
              machineDisplay = `${machine.machine_number}${machine.description ? ' - ' + machine.description : ''}`;
            }
          }
          
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${item.roll_id}</td>
            <td>${roll.customer_name}</td>
            <td>${roll.color_or_type}</td>
            <td>${parseFloat(item.initial_weight).toFixed(2)} kg</td>
            <td>${item.operator}</td>
            <td>${machineDisplay}</td>
            <td>${item.bobbin_quantity || '0'} (${item.bobbin_type || 'N/A'})</td>
            <td>${item.issued_date}</td>
            <td>
              <button type="button" class="btn-receive" data-roll-id="${item.roll_id}">Receive</button>
            </td>
          `;
          issuedRollsTable.appendChild(row);
        }
      });

      // Add event listeners for receive buttons
      document.querySelectorAll('.btn-receive').forEach(button => {
        button.addEventListener('click', function() {
          const rollId = this.getAttribute('data-roll-id');
          navigateToReceiveFromMachine(rollId);
        });
      });
    })
    .catch(error => {
      console.error('Error loading issued rolls:', error);
      issuedRollsTable.innerHTML = `<tr><td colspan="9" class="text-center">Error loading issued rolls: ${error}</td></tr>`;
    });
}

// Function to navigate to receive from machine screen and select the roll
function navigateToReceiveFromMachine(rollId) {
  // Switch to the receive from machine screen
  const receiveScreen = document.getElementById('receive-from-machine-screen');
  const rollSelect = document.getElementById('on-machine-select');
  
  // Show the receive from machine screen
  document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'));
  receiveScreen.classList.remove('hidden');
  
  // Update the active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-screen') === 'receive-from-machine') {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  // Load bobbin types and box types for dropdowns
  populateBobbinTypeDropdown('bobbin-type-receive');
  populateBoxTypeDropdown('box-type');
  
  // Wait for the roll data to be loaded in the dropdown
  window.api.getGoodsOnMachine()
    .then(goodsOnMachine => {
      // Populate the roll select dropdown if it's empty
      if (rollSelect.options.length <= 1) {
        const onMachineRolls = goodsOnMachine.filter(item => item.status === 'issued_to_machine');
        return Promise.all([
          onMachineRolls,
          window.api.getRolls()
        ]).then(([onMachineRolls, rolls]) => {
          onMachineRolls.forEach(item => {
            const roll = rolls.find(r => r.roll_id === item.roll_id);
            if (roll) {
              const option = document.createElement('option');
              option.value = roll.roll_id;
              option.textContent = `${roll.roll_id} - ${roll.customer_name} - ${roll.color_or_type}`;
              rollSelect.appendChild(option);
            }
          });
        });
      }
    })
    .then(() => {
      // Set the selected roll in the dropdown
      rollSelect.value = rollId;
      
      // Trigger the change event to load roll details
      const event = new Event('change');
      rollSelect.dispatchEvent(event);
      
      // Focus on the gross weight field
      const grossWeightInput = document.getElementById('gross-weight');
      if (grossWeightInput) {
        grossWeightInput.focus();
      }
    })
    .catch(error => {
      console.error('Error loading rolls:', error);
      alert('Error loading rolls. Please try again.');
    });
}

// Receive from Machine Screen Functions
function setupReceiveFromMachineScreen() {
  const onMachineSelect = document.getElementById('on-machine-select');
  const onMachineDetails = document.getElementById('on-machine-details');
  const boxEntryContainer = document.getElementById('box-entry-container');
  const boxForm = document.getElementById('box-form');
  const addBoxBtn = document.getElementById('add-box-btn');
  const boxesTableContainer = document.getElementById('boxes-table-container');
  const boxesTable = document.getElementById('boxes-table').querySelector('tbody');
  const wastageCheckbox = document.getElementById('wastage-checkbox');
  const saveBoxesBtn = document.getElementById('save-boxes-btn');
  
  let currentRollData = null;
  let boxesAdded = [];
  
  // Function to calculate and update tare weight
  function updateTareWeight() {
    const bobbinCount = parseInt(document.getElementById('bobbin-count').value) || 0;
    const bobbinType = document.getElementById('bobbin-type-receive').value;
    const boxType = document.getElementById('box-type').value;
    const tareWeightInput = document.getElementById('tare-weight');
    const grossWeightInput = document.getElementById('gross-weight');
    
    // Get bobbin type weight and box type weight
    Promise.all([
      window.api.getBobbinTypes(),
      window.api.getBoxTypes()
    ]).then(([bobbinTypes, boxTypes]) => {
      const selectedBobbin = bobbinTypes.find(b => b.type_name === bobbinType);
      const selectedBox = boxTypes.find(b => b.type_name === boxType);
      
      let totalTareWeight = 0;
      
      // Add bobbin weights if bobbin type and count are selected
      if (selectedBobbin && bobbinCount > 0) {
        // Convert bobbin weight from grams to kg (since bobbin weight is stored in grams)
        const bobbinWeightKg = (selectedBobbin.weight / 1000);
        totalTareWeight += bobbinWeightKg * bobbinCount;
      }
      
      // Add box weight if box type is selected
      if (selectedBox && selectedBox.tare_weight) {
        totalTareWeight += parseFloat(selectedBox.tare_weight);
      }
      
      // Update tare weight input with 2 decimal places
      tareWeightInput.value = totalTareWeight.toFixed(2);
      
      // If gross weight is already entered, update net weight
      const grossWeight = parseFloat(grossWeightInput.value);
      if (!isNaN(grossWeight)) {
        updateNetWeight(grossWeight, totalTareWeight);
      }
    });
  }
  
  // Function to calculate and display net weight
  function updateNetWeight(grossWeight, tareWeight) {
    const netWeight = grossWeight - tareWeight;
    const netWeightInput = document.getElementById('net-weight');
    netWeightInput.value = netWeight.toFixed(2);
    return netWeight;
  }
  
  // Add event listeners for automatic tare weight calculation
  document.getElementById('bobbin-count').addEventListener('input', updateTareWeight);
  document.getElementById('bobbin-type-receive').addEventListener('change', updateTareWeight);
  document.getElementById('box-type').addEventListener('change', updateTareWeight);
  
  // Add event listener for gross weight changes
  document.getElementById('gross-weight').addEventListener('input', function() {
    const grossWeight = parseFloat(this.value) || 0;
    const tareWeight = parseFloat(document.getElementById('tare-weight').value) || 0;
    updateNetWeight(grossWeight, tareWeight);
  });

  // Add event listener for tare weight changes
  document.getElementById('tare-weight').addEventListener('input', function() {
    const grossWeight = parseFloat(document.getElementById('gross-weight').value) || 0;
    const tareWeight = parseFloat(this.value) || 0;
    updateNetWeight(grossWeight, tareWeight);
  });
  
  // Roll selection change
  onMachineSelect.addEventListener('change', function() {
    const selectedRollId = this.value;
    
    boxesAdded = [];
    boxesTable.innerHTML = '';
    boxesTableContainer.classList.add('hidden');
    
    if (!selectedRollId) {
      onMachineDetails.classList.add('hidden');
      boxEntryContainer.classList.add('hidden');
      return;
    }
    
    // Get the goods on machine data and machines
    Promise.all([
      window.api.getGoodsOnMachine(),
      window.api.getMachines(),
      window.api.getRolls()
    ])
      .then(([goodsOnMachine, machines, rolls]) => {
        const selectedGoods = goodsOnMachine.find(item => item.roll_id === selectedRollId);
        
        if (selectedGoods) {
          // Save the current roll data
          currentRollData = selectedGoods;
          
          // Find machine details
          let machineInfo = selectedGoods.machine_number || 'N/A';
          if (selectedGoods.machine_id) {
            const machine = machines.find(m => m.machine_id === selectedGoods.machine_id);
            if (machine) {
              machineInfo = `${machine.machine_number}${machine.description ? ' - ' + machine.description : ''}`;
            }
          }
          
          const roll = rolls.find(r => r.roll_id === selectedRollId);
          
          if (roll) {
            const weightReceived = parseFloat(selectedGoods.weight_received_so_far) || 0;
            const initialWeight = parseFloat(selectedGoods.initial_weight);
            const pendingWeight = initialWeight - weightReceived;
            
            // Display details
            onMachineDetails.innerHTML = `
              <p><strong>Roll ID:</strong> ${roll.roll_id}</p>
              <p><strong>Customer:</strong> ${roll.customer_name}</p>
              <p><strong>Color/Type:</strong> ${roll.color_or_type}</p>
              <p><strong>Machine:</strong> ${machineInfo}</p>
              <p><strong>Bobbin:</strong> ${selectedGoods.bobbin_quantity || '0'} (${selectedGoods.bobbin_type || 'N/A'})</p>
              <p><strong>Initial Weight:</strong> ${initialWeight.toFixed(2)} kg</p>
              <p><strong>Weight Received So Far:</strong> ${weightReceived.toFixed(2)} kg</p>
              <p><strong>Pending Weight:</strong> ${pendingWeight.toFixed(2)} kg</p>
            `;
            
            onMachineDetails.classList.remove('hidden');
            boxEntryContainer.classList.remove('hidden');
          }
        }
      })
      .catch(error => {
        console.error('Error loading details:', error);
        alert('Error loading details: ' + error);
      });
  });
  
  // Add box button click
  addBoxBtn.addEventListener('click', function() {
    const grossWeight = parseFloat(document.getElementById('gross-weight').value);
    const tareWeight = parseFloat(document.getElementById('tare-weight').value);
    const netWeight = parseFloat(document.getElementById('net-weight').value);
    const bobbinCount = parseInt(document.getElementById('bobbin-count').value);
    const bobbinType = document.getElementById('bobbin-type-receive').value;
    const boxType = document.getElementById('box-type').value;
    
    // Validate all required fields
    if (isNaN(grossWeight) || grossWeight <= 0) {
      alert('Please enter a valid gross weight (greater than 0).');
      return;
    }
    
    if (isNaN(tareWeight) || tareWeight <= 0) {
      alert('Please enter a valid tare weight (greater than 0).');
      return;
    }

    if (isNaN(netWeight) || netWeight <= 0) {
      alert('Net weight must be greater than 0. Please check gross weight and tare weight values.');
      return;
    }
    
    if (isNaN(bobbinCount) || bobbinCount <= 0) {
      alert('Please enter a valid bobbin count (greater than 0).');
      return;
    }
    
    if (!bobbinType) {
      alert('Please select a bobbin type.');
      return;
    }
    
    if (!boxType) {
      alert('Please select a box type.');
      return;
    }
    
    // Get the initial weight and weight received so far
    const initialWeight = parseFloat(currentRollData.initial_weight);
    const previouslyReceived = parseFloat(currentRollData.weight_received_so_far) || 0;
    const potentialTotalReceived = previouslyReceived + netWeight;
    
    // Check if adding this box would exceed the initial weight (unless marked as wastage)
    if (potentialTotalReceived > initialWeight && !wastageCheckbox.checked) {
      const proceed = confirm(
        `Warning: Adding this box will exceed the initial roll weight.\n\n` +
        `Initial Weight: ${initialWeight.toFixed(2)} kg\n` +
        `Previously Received: ${previouslyReceived.toFixed(2)} kg\n` +
        `This Box Net Weight: ${netWeight.toFixed(2)} kg\n` +
        `Total After Adding: ${potentialTotalReceived.toFixed(2)} kg\n\n` +
        `Do you want to proceed? If yes, please mark as wastage.`
      );
      if (!proceed) {
        return;
      }
      // Automatically check the wastage checkbox
      wastageCheckbox.checked = true;
    }
    
    // Generate box ID and add box
    window.api.generateId('BOX')
      .then(boxId => {
        // Add to local array
        const boxData = {
          box_id: boxId,
          roll_id: currentRollData.roll_id,
          gross_weight: grossWeight,
          tare_weight: tareWeight,
          net_weight: netWeight,
          bobbin_count: bobbinCount,
          bobbin_type: bobbinType,
          box_type: boxType,
          date_created: new Date().toISOString().split('T')[0],
          status: 'ready_to_dispatch'
        };
        
        boxesAdded.push(boxData);
        
        // Add row to table
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${boxData.box_id}</td>
          <td>${boxData.gross_weight.toFixed(2)} kg</td>
          <td>${boxData.tare_weight.toFixed(2)} kg</td>
          <td>${boxData.net_weight.toFixed(2)} kg</td>
          <td>${boxData.bobbin_count}</td>
          <td>
            <button type="button" class="btn-secondary remove-box" data-box-id="${boxData.box_id}">Remove</button>
          </td>
        `;
        
        boxesTable.appendChild(row);
        boxesTableContainer.classList.remove('hidden');
        
        // Update totals
        updateBoxesTotals();
        
        // Clear form
        document.getElementById('gross-weight').value = '';
        document.getElementById('tare-weight').value = '';
        document.getElementById('net-weight').value = '';
        document.getElementById('bobbin-count').value = '';
        document.getElementById('bobbin-type-receive').selectedIndex = 0;
        document.getElementById('box-type').selectedIndex = 0;
        
        // Focus on gross weight for next entry
        document.getElementById('gross-weight').focus();
      })
      .catch(error => {
        console.error('Error generating box ID:', error);
        alert('Error adding box: ' + error);
      });
  });
  
  // Remove box button click (delegated)
  boxesTable.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-box')) {
      const boxId = e.target.getAttribute('data-box-id');
      
      // Remove from array
      boxesAdded = boxesAdded.filter(box => box.box_id !== boxId);
      
      // Remove row
      e.target.closest('tr').remove();
      
      // Update totals
      updateBoxesTotals();
      
      // Hide table if no more boxes
      if (boxesAdded.length === 0) {
        boxesTableContainer.classList.add('hidden');
      }
    }
  });
  
  // Save boxes button click
  saveBoxesBtn.addEventListener('click', function() {
    if (boxesAdded.length === 0) {
      alert('Please add at least one box.');
      return;
    }
    
    const initialWeight = parseFloat(currentRollData.initial_weight);
    const previouslyReceived = parseFloat(currentRollData.weight_received_so_far) || 0;
    const currentReceived = boxesAdded.reduce((sum, box) => sum + box.net_weight, 0);
    const totalReceived = previouslyReceived + currentReceived;
    const pendingWeight = initialWeight - totalReceived;
    const isWastage = wastageCheckbox.checked;
    
    // Validate
    if (totalReceived > initialWeight && !isWastage) {
      alert('Total received weight exceeds initial weight. Please check your entries or mark as wastage.');
      return;
    }
    
    // Confirm save
    const confirmMsg = `
      You are about to save ${boxesAdded.length} boxes with total weight: ${currentReceived.toFixed(2)} kg.
      
      Initial Roll Weight: ${initialWeight.toFixed(2)} kg
      Previously Received: ${previouslyReceived.toFixed(2)} kg
      Current Boxes Weight: ${currentReceived.toFixed(2)} kg
      Total Received: ${totalReceived.toFixed(2)} kg
      Pending Weight: ${Math.max(0, pendingWeight).toFixed(2)} kg
      
      ${pendingWeight <= 0 || isWastage ? 'This will mark the roll as COMPLETED.' : 'This will update the roll\'s received weight.'}
      
      All boxes will be marked as ready for dispatch.
      Do you want to continue?
    `;
    
    if (!confirm(confirmMsg)) {
      return;
    }
    
    // Show loading message
    saveBoxesBtn.disabled = true;
    saveBoxesBtn.textContent = 'Saving...';
    
    // Create boxes and update goods on machine
    Promise.all(boxesAdded.map(box => window.api.createBox(box)))
      .then(() => {
        // Update goods on machine record
        const updateData = {
          roll_id: currentRollData.roll_id,
          weight_received_so_far: totalReceived.toFixed(2),
          wastage_marked: isWastage || pendingWeight <= 0
        };
        
        return window.api.updateGoodsOnMachine(currentRollData.roll_id, updateData);
      })
      .then(() => {
        // Update roll status if completed
        if (isWastage || pendingWeight <= 0) {
          return window.api.updateRollStatus(currentRollData.roll_id, 'completed');
        }
        return Promise.resolve();
      })
      .then(() => {
        alert(`Boxes saved successfully! ${boxesAdded.length} boxes are now ready for dispatch.`);
        
        // Reset the screen
        onMachineSelect.value = '';
        onMachineDetails.classList.add('hidden');
        boxEntryContainer.classList.add('hidden');
        boxesAdded = [];
        boxesTable.innerHTML = '';
        boxesTableContainer.classList.add('hidden');
        wastageCheckbox.checked = false;
        
        // Reload rolls on machine
        loadRollsOnMachine();
        
        // Print labels
        boxesAdded.forEach(box => {
          window.api.printLabel({
            type: 'box',
            data: box
          });
        });
        
        // Re-enable save button
        saveBoxesBtn.disabled = false;
        saveBoxesBtn.textContent = 'Save & Print Labels';
      })
      .catch(error => {
        alert('Error saving boxes: ' + error);
        saveBoxesBtn.disabled = false;
        saveBoxesBtn.textContent = 'Save & Print Labels';
      });
  });
}

function loadRollsOnMachine() {
  const onMachineSelect = document.getElementById('on-machine-select');
  
  // Clear existing options except the first one
  while (onMachineSelect.options.length > 1) {
    onMachineSelect.remove(1);
  }
  
  // Get rolls on machine
  window.api.getGoodsOnMachine()
    .then(goodsOnMachine => {
      return Promise.all([
        goodsOnMachine,
        window.api.getRolls()
      ]);
    })
    .then(([goodsOnMachine, rolls]) => {
      goodsOnMachine.forEach(goods => {
        const roll = rolls.find(r => r.roll_id === goods.roll_id);
        
        if (roll && roll.status === 'issued_to_machine') {
          const option = document.createElement('option');
          option.value = roll.roll_id;
          option.textContent = `${roll.roll_id} - ${roll.customer_name} - ${roll.color_or_type}`;
          onMachineSelect.appendChild(option);
        }
      });
    })
    .catch(error => {
      console.error('Error loading rolls on machine:', error);
    });
}

// Dispatch Screen Functions
function setupDispatchScreen() {
  const boxScan = document.getElementById('box-scan');
  const addToDispatchBtn = document.getElementById('add-to-dispatch-btn');
  const availableBoxesContainer = document.getElementById('available-boxes-container');
  const dispatchCartContainer = document.getElementById('dispatch-cart-container');
  const dispatchCartTable = document.getElementById('dispatch-cart-table').querySelector('tbody');
  const totalWeightElement = document.getElementById('total-weight');
  const totalBobbinsElement = document.getElementById('total-bobbins');
  const confirmDispatchBtn = document.getElementById('confirm-dispatch-btn');
  
  let dispatchCart = [];
  
  // Add box to dispatch (from scan or manual entry)
  addToDispatchBtn.addEventListener('click', function() {
    const boxId = boxScan.value.trim();
    
    if (!boxId) {
      alert('Please enter or scan a box ID.');
      return;
    }
    
    addBoxToDispatch(boxId);
    boxScan.value = '';
    boxScan.focus();
  });
  
  // Also allow pressing Enter in the scan field
  boxScan.addEventListener('keyup', function(e) {
    if (e.key === 'Enter') {
      addToDispatchBtn.click();
    }
  });
  
  // Click on available box
  availableBoxesContainer.addEventListener('click', function(e) {
    const boxCard = e.target.closest('.box-card');
    if (boxCard) {
      const boxId = boxCard.getAttribute('data-box-id');
      addBoxToDispatch(boxId);
    }
  });
  
  // Remove from cart
  dispatchCartTable.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-from-cart')) {
      const boxId = e.target.getAttribute('data-box-id');
      
      // Remove from cart array
      dispatchCart = dispatchCart.filter(box => box.box_id !== boxId);
      
      // Remove row
      e.target.closest('tr').remove();
      
      // Update totals
      updateDispatchTotals();
      
      // Hide cart if empty
      if (dispatchCart.length === 0) {
        dispatchCartContainer.classList.add('hidden');
      }
      
      // Update available boxes
      loadBoxesReadyToDispatch();
    }
  });
  
  // Confirm dispatch
  confirmDispatchBtn.addEventListener('click', function() {
    if (dispatchCart.length === 0) {
      alert('Please add at least one box to dispatch.');
      return;
    }
    
    const customerName = document.getElementById('customer-dispatch').value;
    
    if (!customerName) {
      alert('Please select a customer.');
      return;
    }
    
    const totalWeight = dispatchCart.reduce((sum, box) => sum + parseFloat(box.net_weight), 0);
    const totalBobbins = dispatchCart.reduce((sum, box) => sum + parseInt(box.bobbin_count), 0);
    
    const dispatchData = {
      dispatch_date: new Date().toISOString().split('T')[0],
      customer_name: customerName,
      box_ids: dispatchCart.map(box => box.box_id).join(','),
      total_weight: totalWeight.toFixed(2),
      total_bobbins: totalBobbins
    };
    
    window.api.createDispatch(dispatchData)
      .then(() => {
        // Update each box status to 'dispatched'
        return Promise.all(
          dispatchCart.map(box => 
            window.api.updateBoxStatus(box.box_id, 'dispatched')
          )
        );
      })
      .then(() => {
        alert('Dispatch completed successfully!');
        
        // Print dispatch note
        window.api.printLabel({
          type: 'dispatch',
          data: {
            ...dispatchData,
            boxes: dispatchCart
          }
        });
        
        // Reset form
        dispatchCart = [];
        dispatchCartTable.innerHTML = '';
        document.getElementById('customer-dispatch').selectedIndex = 0; // Reset dropdown
        dispatchCartContainer.classList.add('hidden');
        
        // Reload available boxes
        loadBoxesReadyToDispatch();
      })
      .catch(error => {
        alert('Error creating dispatch: ' + error);
      });
  });
  
  function addBoxToDispatch(boxId) {
    // Check if already in cart
    if (dispatchCart.some(box => box.box_id === boxId)) {
      alert('This box is already in the dispatch cart.');
      return;
    }
    
    // Get box details
    window.api.getBoxes()
      .then(boxes => {
        const box = boxes.find(b => b.box_id === boxId && b.status === 'ready_to_dispatch');
        
        if (!box) {
          alert('Box not found or not ready to dispatch.');
          return;
        }
        
        // Add to cart
        dispatchCart.push(box);
        
        // Add row to table
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${box.box_id}</td>
          <td>${box.roll_id}</td>
          <td>${parseFloat(box.net_weight).toFixed(2)} kg</td>
          <td>${box.bobbin_count}</td>
          <td>
            <button type="button" class="btn-secondary remove-from-cart" data-box-id="${box.box_id}">Remove</button>
          </td>
        `;
        
        dispatchCartTable.appendChild(row);
        dispatchCartContainer.classList.remove('hidden');
        
        // Update totals
        updateDispatchTotals();
        
        // Refresh available boxes
        loadBoxesReadyToDispatch();
      })
      .catch(error => {
        console.error('Error adding box to dispatch:', error);
      });
  }
  
  function updateDispatchTotals() {
    const totalWeight = dispatchCart.reduce((sum, box) => sum + parseFloat(box.net_weight), 0);
    const totalBobbins = dispatchCart.reduce((sum, box) => sum + parseInt(box.bobbin_count), 0);
    
    totalWeightElement.textContent = `${totalWeight.toFixed(2)} kg`;
    totalBobbinsElement.textContent = totalBobbins;
  }
}

function loadBoxesReadyToDispatch() {
  const availableBoxesContainer = document.getElementById('available-boxes-container');
  availableBoxesContainer.innerHTML = '';
  
  // Get boxes ready to dispatch
  window.api.getBoxes()
    .then(boxes => {
      const readyBoxes = boxes.filter(box => box.status === 'ready_to_dispatch');
      
      if (readyBoxes.length === 0) {
        availableBoxesContainer.innerHTML = '<p>No boxes available for dispatch.</p>';
        return;
      }
      
      // Create box cards
      readyBoxes.forEach(box => {
        // Skip if already in dispatch cart
        if (document.querySelector(`.remove-from-cart[data-box-id="${box.box_id}"]`)) {
          return;
        }
        
        const boxCard = document.createElement('div');
        boxCard.className = 'box-card';
        boxCard.setAttribute('data-box-id', box.box_id);
        
        boxCard.innerHTML = `
          <p><strong>Box ID:</strong> ${box.box_id}</p>
          <p><strong>Roll ID:</strong> ${box.roll_id}</p>
          <p><strong>Net Weight:</strong> ${parseFloat(box.net_weight).toFixed(2)} kg</p>
          <p><strong>Bobbin Count:</strong> ${box.bobbin_count}</p>
          <p><strong>Date Created:</strong> ${box.date_created}</p>
        `;
        
        availableBoxesContainer.appendChild(boxCard);
      });
    })
    .catch(error => {
      console.error('Error loading boxes ready to dispatch:', error);
    });
}

// Reports Screen Functions
function setupReportsScreen() {
  document.getElementById('stock-report-btn').addEventListener('click', generateStockReport);
  document.getElementById('prod-report-btn').addEventListener('click', generateProductionReport);
  document.getElementById('disp-report-btn').addEventListener('click', generateDispatchReport);
}

function generateStockReport() {
  alert('Stock report will be generated. This feature will be implemented in the next phase.');
}

function generateProductionReport() {
  const fromDate = document.getElementById('prod-report-from').value;
  const toDate = document.getElementById('prod-report-to').value;
  
  if (!fromDate || !toDate) {
    alert('Please select both from and to dates.');
    return;
  }
  
  alert(`Production report from ${fromDate} to ${toDate} will be generated. This feature will be implemented in the next phase.`);
}

function generateDispatchReport() {
  const fromDate = document.getElementById('disp-report-from').value;
  const toDate = document.getElementById('disp-report-to').value;
  
  if (!fromDate || !toDate) {
    alert('Please select both from and to dates.');
    return;
  }
  
  alert(`Dispatch report from ${fromDate} to ${toDate} will be generated. This feature will be implemented in the next phase.`);
}

// Masters Screen Functions
function setupMastersTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Add event listeners to tab buttons
  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Hide all tab contents
      tabContents.forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
      });
      
      // Remove active class from all tab buttons
      tabButtons.forEach(btn => {
        btn.classList.remove('active');
      });
      
      // Show the selected tab content
      const tabId = this.getAttribute('data-tab');
      const tabContent = document.getElementById(tabId);
      if (tabContent) {
        tabContent.classList.remove('hidden');
        tabContent.classList.add('active');
      }
      
      // Add active class to the clicked button
      this.classList.add('active');
      
      // Load the data for the selected tab
      if (tabId === 'customers-tab') {
        loadCustomers();
      } else if (tabId === 'bobbin-types-tab') {
        loadBobbinTypes();
      } else if (tabId === 'box-types-tab') {
        loadBoxTypes();
      } else if (tabId === 'machines-tab') {
        loadMachines();
      }
    });
  });
  
  // Setup individual tabs
  setupCustomerManagement();
  setupBobbinTypeManagement();
  setupBoxTypeManagement();
  setupMachineManagement();
}

// Customers Tab Functions
function setupCustomerManagement() {
  const newCustomerBtn = document.getElementById('new-customer-btn');
  const customerForm = document.getElementById('customer-form');
  const cancelCustomerBtn = document.getElementById('cancel-customer-btn');
  const customersTable = document.getElementById('customers-table').querySelector('tbody');
  const customerFormContainer = document.getElementById('customer-form-container');
  const customerFormTitle = document.getElementById('customer-form-title');
  
  // New Customer button click
  newCustomerBtn.addEventListener('click', function() {
    // Reset the form for a new customer
    customerForm.reset();
    document.getElementById('customer-id').value = '';
    customerFormTitle.textContent = 'New Customer';
    
    // Show the form
    customerFormContainer.classList.remove('hidden');
  });
  
  // Cancel button click
  cancelCustomerBtn.addEventListener('click', function() {
    customerForm.reset();
    customerFormContainer.classList.add('hidden');
  });
  
  // Form submission
  customerForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const customerId = document.getElementById('customer-id').value;
    const customerData = {
      customer_name: document.getElementById('customer-name-input').value,
      contact_person: document.getElementById('contact-person').value,
      contact_number: document.getElementById('contact-number').value,
      email: document.getElementById('customer-email').value,
      address: document.getElementById('customer-address').value,
      notes: document.getElementById('customer-notes').value
    };
    
    if (customerId) {
      // Update existing customer
      window.api.updateCustomer(customerId, customerData)
        .then(() => {
          alert('Customer updated successfully!');
          customerFormContainer.classList.add('hidden');
          loadCustomers();
        })
        .catch(error => {
          alert('Error updating customer: ' + error);
        });
    } else {
      // Create new customer
      window.api.createCustomer(customerData)
        .then(() => {
          alert('Customer created successfully!');
          customerFormContainer.classList.add('hidden');
          loadCustomers();
        })
        .catch(error => {
          alert('Error creating customer: ' + error);
        });
    }
  });
  
  // Edit/Delete button clicks (event delegation)
  customersTable.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-edit')) {
      const customerId = e.target.getAttribute('data-id');
      editCustomer(customerId);
    } else if (e.target.classList.contains('btn-delete')) {
      const customerId = e.target.getAttribute('data-id');
      const customerName = e.target.getAttribute('data-name');
      if (confirm(`Are you sure you want to delete customer "${customerName}"?`)) {
        deleteCustomer(customerId);
      }
    }
  });
}

function loadCustomers() {
  const customersTable = document.getElementById('customers-table').querySelector('tbody');
  customersTable.innerHTML = '';
  
  window.api.getCustomers()
    .then(customers => {
      if (customers.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No customers found. Add a new customer to get started.</td>';
        customersTable.appendChild(row);
        return;
      }
      
      customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${customer.customer_id}</td>
          <td>${customer.customer_name}</td>
          <td>${customer.contact_person || '-'}</td>
          <td>${customer.contact_number || '-'}</td>
          <td>${customer.email || '-'}</td>
          <td>
            <button class="btn-edit" data-id="${customer.customer_id}">Edit</button>
            <button class="btn-delete" data-id="${customer.customer_id}" data-name="${customer.customer_name}">Delete</button>
          </td>
        `;
        customersTable.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error loading customers:', error);
      customersTable.innerHTML = `<tr><td colspan="6" class="text-center">Error loading customers: ${error}</td></tr>`;
    });
}

function editCustomer(customerId) {
  window.api.getCustomers()
    .then(customers => {
      const customer = customers.find(c => c.customer_id === customerId);
      
      if (customer) {
        // Populate the form with customer data
        document.getElementById('customer-id').value = customer.customer_id;
        document.getElementById('customer-name-input').value = customer.customer_name;
        document.getElementById('contact-person').value = customer.contact_person || '';
        document.getElementById('contact-number').value = customer.contact_number || '';
        document.getElementById('customer-email').value = customer.email || '';
        document.getElementById('customer-address').value = customer.address || '';
        document.getElementById('customer-notes').value = customer.notes || '';
        
        // Update form title and show the form
        document.getElementById('customer-form-title').textContent = 'Edit Customer';
        document.getElementById('customer-form-container').classList.remove('hidden');
      }
    })
    .catch(error => {
      console.error('Error loading customer details:', error);
      alert('Error loading customer details: ' + error);
    });
}

function deleteCustomer(customerId) {
  window.api.deleteCustomer(customerId)
    .then(() => {
      alert('Customer deleted successfully!');
      loadCustomers();
    })
    .catch(error => {
      alert('Error deleting customer: ' + error);
    });
}

// Bobbin Types Tab Functions
function setupBobbinTypeManagement() {
  const newBobbinTypeBtn = document.getElementById('new-bobbin-type-btn');
  const bobbinTypeForm = document.getElementById('bobbin-type-form');
  const cancelBobbinTypeBtn = document.getElementById('cancel-bobbin-type-btn');
  const bobbinTypesTable = document.getElementById('bobbin-types-table').querySelector('tbody');
  const bobbinTypeFormContainer = document.getElementById('bobbin-type-form-container');
  const bobbinTypeFormTitle = document.getElementById('bobbin-type-form-title');
  
  // New Bobbin Type button click
  newBobbinTypeBtn.addEventListener('click', function() {
    // Reset the form for a new bobbin type
    bobbinTypeForm.reset();
    document.getElementById('bobbin-type-id').value = '';
    bobbinTypeFormTitle.textContent = 'New Bobbin Type';
    
    // Show the form
    bobbinTypeFormContainer.classList.remove('hidden');
  });
  
  // Cancel button click
  cancelBobbinTypeBtn.addEventListener('click', function() {
    bobbinTypeForm.reset();
    bobbinTypeFormContainer.classList.add('hidden');
  });
  
  // Form submission
  bobbinTypeForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const bobbinTypeId = document.getElementById('bobbin-type-id').value;
    const bobbinTypeData = {
      type_name: document.getElementById('type-name').value,
      description: document.getElementById('type-description').value,
      weight: parseFloat(document.getElementById('type-weight').value) || 0,
      notes: document.getElementById('type-notes').value
    };
    
    if (bobbinTypeId) {
      // Update existing bobbin type
      window.api.updateBobbinType(bobbinTypeId, bobbinTypeData)
        .then(() => {
          alert('Bobbin type updated successfully!');
          bobbinTypeFormContainer.classList.add('hidden');
          loadBobbinTypes();
        })
        .catch(error => {
          alert('Error updating bobbin type: ' + error);
        });
    } else {
      // Create new bobbin type
      window.api.createBobbinType(bobbinTypeData)
        .then(() => {
          alert('Bobbin type created successfully!');
          bobbinTypeFormContainer.classList.add('hidden');
          loadBobbinTypes();
        })
        .catch(error => {
          alert('Error creating bobbin type: ' + error);
        });
    }
  });
  
  // Edit/Delete button clicks (event delegation)
  bobbinTypesTable.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-edit')) {
      const bobbinTypeId = e.target.getAttribute('data-id');
      editBobbinType(bobbinTypeId);
    } else if (e.target.classList.contains('btn-delete')) {
      const bobbinTypeId = e.target.getAttribute('data-id');
      const typeName = e.target.getAttribute('data-name');
      if (confirm(`Are you sure you want to delete bobbin type "${typeName}"?`)) {
        deleteBobbinType(bobbinTypeId);
      }
    }
  });
}

function loadBobbinTypes() {
  const bobbinTypesTable = document.getElementById('bobbin-types-table').querySelector('tbody');
  bobbinTypesTable.innerHTML = '';
  
  window.api.getBobbinTypes()
    .then(bobbinTypes => {
      if (bobbinTypes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">No bobbin types found. Add a new type to get started.</td>';
        bobbinTypesTable.appendChild(row);
        return;
      }
      
      bobbinTypes.forEach(type => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${type.bobbin_type_id}</td>
          <td>${type.type_name}</td>
          <td>${type.description || '-'}</td>
          <td>${type.weight ? type.weight.toFixed(2) : '0.00'}</td>
          <td>
            <button class="btn-edit" data-id="${type.bobbin_type_id}">Edit</button>
            <button class="btn-delete" data-id="${type.bobbin_type_id}" data-name="${type.type_name}">Delete</button>
          </td>
        `;
        bobbinTypesTable.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error loading bobbin types:', error);
      bobbinTypesTable.innerHTML = `<tr><td colspan="5" class="text-center">Error loading bobbin types: ${error}</td></tr>`;
    });
}

function editBobbinType(bobbinTypeId) {
  window.api.getBobbinTypes()
    .then(bobbinTypes => {
      const bobbinType = bobbinTypes.find(t => t.bobbin_type_id === bobbinTypeId);
      
      if (bobbinType) {
        // Populate the form with bobbin type data
        document.getElementById('bobbin-type-id').value = bobbinType.bobbin_type_id;
        document.getElementById('type-name').value = bobbinType.type_name;
        document.getElementById('type-description').value = bobbinType.description || '';
        document.getElementById('type-weight').value = bobbinType.weight || '';
        document.getElementById('type-notes').value = bobbinType.notes || '';
        
        // Update form title and show the form
        document.getElementById('bobbin-type-form-title').textContent = 'Edit Bobbin Type';
        document.getElementById('bobbin-type-form-container').classList.remove('hidden');
      }
    })
    .catch(error => {
      console.error('Error loading bobbin type details:', error);
      alert('Error loading bobbin type details: ' + error);
    });
}

function deleteBobbinType(bobbinTypeId) {
  window.api.deleteBobbinType(bobbinTypeId)
    .then(() => {
      alert('Bobbin type deleted successfully!');
      loadBobbinTypes();
    })
    .catch(error => {
      alert('Error deleting bobbin type: ' + error);
    });
}

// Add the Box Types Tab functions
function setupBoxTypeManagement() {
  const newBoxTypeBtn = document.getElementById('new-box-type-btn');
  const boxTypeForm = document.getElementById('box-type-form');
  const cancelBoxTypeBtn = document.getElementById('cancel-box-type-btn');
  const boxTypesTable = document.getElementById('box-types-table').querySelector('tbody');
  const boxTypeFormContainer = document.getElementById('box-type-form-container');
  const boxTypeFormTitle = document.getElementById('box-type-form-title');
  
  // New Box Type button click
  newBoxTypeBtn.addEventListener('click', function() {
    // Reset the form for a new box type
    boxTypeForm.reset();
    document.getElementById('box-type-id').value = '';
    boxTypeFormTitle.textContent = 'New Box Type';
    
    // Show the form
    boxTypeFormContainer.classList.remove('hidden');
  });
  
  // Cancel button click
  cancelBoxTypeBtn.addEventListener('click', function() {
    boxTypeForm.reset();
    boxTypeFormContainer.classList.add('hidden');
  });
  
  // Form submission
  boxTypeForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const boxTypeId = document.getElementById('box-type-id').value;
    const boxTypeData = {
      type_name: document.getElementById('box-type-name').value,
      description: document.getElementById('box-type-description').value,
      dimensions: document.getElementById('box-dimensions').value,
      tare_weight: parseFloat(document.getElementById('box-tare-weight').value) || 0,
      notes: document.getElementById('box-type-notes').value
    };
    
    if (boxTypeId) {
      // Update existing box type
      window.api.updateBoxType(boxTypeId, boxTypeData)
        .then(() => {
          alert('Box type updated successfully!');
          boxTypeFormContainer.classList.add('hidden');
          loadBoxTypes();
        })
        .catch(error => {
          alert('Error updating box type: ' + error);
        });
    } else {
      // Create new box type
      window.api.createBoxType(boxTypeData)
        .then(() => {
          alert('Box type created successfully!');
          boxTypeFormContainer.classList.add('hidden');
          loadBoxTypes();
        })
        .catch(error => {
          alert('Error creating box type: ' + error);
        });
    }
  });
  
  // Edit/Delete button clicks (event delegation)
  boxTypesTable.addEventListener('click', function(e) {
    if (e.target.classList.contains('btn-edit')) {
      const boxTypeId = e.target.getAttribute('data-id');
      editBoxType(boxTypeId);
    } else if (e.target.classList.contains('btn-delete')) {
      const boxTypeId = e.target.getAttribute('data-id');
      const typeName = e.target.getAttribute('data-name');
      if (confirm(`Are you sure you want to delete box type "${typeName}"?`)) {
        deleteBoxType(boxTypeId);
      }
    }
  });
}

function loadBoxTypes() {
  const boxTypesTable = document.getElementById('box-types-table').querySelector('tbody');
  boxTypesTable.innerHTML = '';
  
  window.api.getBoxTypes()
    .then(boxTypes => {
      if (boxTypes.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No box types found. Add a new box type to get started.</td>';
        boxTypesTable.appendChild(row);
        return;
      }
      
      boxTypes.forEach(type => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${type.box_type_id}</td>
          <td>${type.type_name}</td>
          <td>${type.description || '-'}</td>
          <td>${type.dimensions || '-'}</td>
          <td>${type.tare_weight ? parseFloat(type.tare_weight).toFixed(2) : '0.00'}</td>
          <td>
            <button class="btn-edit" data-id="${type.box_type_id}">Edit</button>
            <button class="btn-delete" data-id="${type.box_type_id}" data-name="${type.type_name}">Delete</button>
          </td>
        `;
        boxTypesTable.appendChild(row);
      });
    })
    .catch(error => {
      console.error('Error loading box types:', error);
      boxTypesTable.innerHTML = `<tr><td colspan="6" class="text-center">Error loading box types: ${error}</td></tr>`;
    });
}

function editBoxType(boxTypeId) {
  window.api.getBoxTypes()
    .then(boxTypes => {
      const boxType = boxTypes.find(t => t.box_type_id === boxTypeId);
      
      if (boxType) {
        // Populate the form with box type data
        document.getElementById('box-type-id').value = boxType.box_type_id;
        document.getElementById('box-type-name').value = boxType.type_name;
        document.getElementById('box-type-description').value = boxType.description || '';
        document.getElementById('box-dimensions').value = boxType.dimensions || '';
        document.getElementById('box-tare-weight').value = boxType.tare_weight || '';
        document.getElementById('box-type-notes').value = boxType.notes || '';
        
        // Update form title and show the form
        document.getElementById('box-type-form-title').textContent = 'Edit Box Type';
        document.getElementById('box-type-form-container').classList.remove('hidden');
      }
    })
    .catch(error => {
      console.error('Error loading box type details:', error);
      alert('Error loading box type details: ' + error);
    });
}

function deleteBoxType(boxTypeId) {
  window.api.deleteBoxType(boxTypeId)
    .then(() => {
      alert('Box type deleted successfully!');
      loadBoxTypes();
    })
    .catch(error => {
      alert('Error deleting box type: ' + error);
    });
}

// Add these utility functions for populating dropdowns

// Populate customer dropdown
function populateCustomerDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  
  // Clear existing options except the first one
  while (dropdown.options.length > 1) {
    dropdown.remove(1);
  }
  
  // Get customers and populate dropdown
  window.api.getCustomers()
    .then(customers => {
      customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.customer_name;
        option.textContent = customer.customer_name;
        dropdown.appendChild(option);
      });
    })
    .catch(error => {
      console.error(`Error loading customers for dropdown ${dropdownId}:`, error);
    });
}

// Populate bobbin type dropdown
function populateBobbinTypeDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  
  // Clear existing options except the first one
  while (dropdown.options.length > 1) {
    dropdown.remove(1);
  }
  
  // Get bobbin types and populate dropdown
  window.api.getBobbinTypes()
    .then(bobbinTypes => {
      bobbinTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.type_name;
        option.textContent = type.type_name;
        dropdown.appendChild(option);
      });
    })
    .catch(error => {
      console.error(`Error loading bobbin types for dropdown ${dropdownId}:`, error);
    });
}

// Populate box type dropdown
function populateBoxTypeDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);
  
  // Clear existing options except the first one
  while (dropdown.options.length > 1) {
    dropdown.remove(1);
  }
  
  // Get box types and populate dropdown
  window.api.getBoxTypes()
    .then(boxTypes => {
      boxTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.type_name;
        option.textContent = `${type.type_name} (${type.dimensions || 'No dimensions'})`;
        
        // Store tare weight as a data attribute for auto-filling
        if (type.tare_weight) {
          option.setAttribute('data-tare-weight', type.tare_weight);
        }
        
        dropdown.appendChild(option);
      });
    })
    .catch(error => {
      console.error(`Error loading box types for dropdown ${dropdownId}:`, error);
    });
}

// Function to update the totals in the boxes cart
function updateBoxesTotals() {
  const totalNetWeightElement = document.getElementById('total-net-weight');
  const totalBobbinCountElement = document.getElementById('total-bobbin-count');
  
  if (boxesAdded.length === 0) {
    totalNetWeightElement.textContent = '0.00 kg';
    totalBobbinCountElement.textContent = '0';
    return;
  }
  
  const totalNetWeight = boxesAdded.reduce((sum, box) => sum + parseFloat(box.net_weight), 0);
  const totalBobbinCount = boxesAdded.reduce((sum, box) => sum + parseInt(box.bobbin_count), 0);
  
  totalNetWeightElement.textContent = `${totalNetWeight.toFixed(2)} kg`;
  totalBobbinCountElement.textContent = totalBobbinCount.toString();
}

// Bobbin Inbound Screen Functions
function setupBobbinInboundForm() {
  const bobbinForm = document.getElementById('bobbin-form');
  const addBobbinBtn = document.getElementById('add-bobbin-btn');
  const resetBobbinBtn = document.getElementById('reset-bobbin-btn');
  const saveBobbinLotBtn = document.getElementById('save-bobbin-lot-btn');
  const addedBobbinsContainer = document.getElementById('added-bobbins-container');
  const addedBobbinsTable = document.getElementById('added-bobbins-table').querySelector('tbody');
  
  // Array to store bobbins for the current lot
  let currentLotBobbins = [];
  
  // Set default date to today
  document.getElementById('bobbin-date-received').value = new Date().toISOString().split('T')[0];
  
  // Load next lot number
  loadNextBobbinLotNumber();
  
  // Load customers and bobbin types for dropdowns
  populateCustomerDropdown('bobbin-customer-name');
  populateBobbinTypeDropdown('bobbin-type-inbound');
  
  // Add bobbin button click
  addBobbinBtn.addEventListener('click', function() {
    const customerName = document.getElementById('bobbin-customer-name').value;
    const bobbinType = document.getElementById('bobbin-type-inbound').value;
    const quantity = parseInt(document.getElementById('bobbin-quantity').value);
    
    // Validate inputs
    if (!customerName) {
      alert('Please select a customer.');
      return;
    }
    
    if (!bobbinType) {
      alert('Please select a bobbin type.');
      return;
    }
    
    if (isNaN(quantity) || quantity <= 0) {
      alert('Please enter a valid quantity.');
      return;
    }
    
    // Create bobbin data object
    const bobbinData = {
      customer_name: customerName,
      bobbin_type: bobbinType,
      quantity: quantity,
      date_received: document.getElementById('bobbin-date-received').value
    };
    
    // Add to the current lot bobbins array
    currentLotBobbins.push(bobbinData);
    
    // Add to the table
    const nextSeqNum = currentLotBobbins.length;
    const lotNumber = document.getElementById('bobbin-lot-number').value;
    const tempBobbinId = `IB-${lotNumber}-${nextSeqNum}`;
    
    const row = document.createElement('tr');
    row.setAttribute('data-index', nextSeqNum - 1);
    row.innerHTML = `
      <td>${tempBobbinId}</td>
      <td>${bobbinData.customer_name}</td>
      <td>${bobbinData.bobbin_type}</td>
      <td>${bobbinData.quantity}</td>
      <td>
        <button type="button" class="btn-delete remove-bobbin" data-index="${nextSeqNum - 1}">Remove</button>
      </td>
    `;
    
    addedBobbinsTable.appendChild(row);
    addedBobbinsContainer.classList.remove('hidden');
    
    // Reset the form for the next entry
    document.getElementById('bobbin-type-inbound').selectedIndex = 0;
    document.getElementById('bobbin-quantity').value = '';
    document.getElementById('bobbin-type-inbound').focus();
  });
  
  // Reset bobbin form button click
  resetBobbinBtn.addEventListener('click', function() {
    document.getElementById('bobbin-customer-name').selectedIndex = 0;
    document.getElementById('bobbin-type-inbound').selectedIndex = 0;
    document.getElementById('bobbin-quantity').value = '';
  });
  
  // Remove bobbin button click (event delegation)
  addedBobbinsTable.addEventListener('click', function(e) {
    if (e.target.classList.contains('remove-bobbin')) {
      const index = parseInt(e.target.getAttribute('data-index'));
      
      // Remove from the array
      currentLotBobbins.splice(index, 1);
      
      // Rebuild the table to update indexes
      rebuildBobbinsTable(currentLotBobbins);
      
      // Hide the container if no bobbins left
      if (currentLotBobbins.length === 0) {
        addedBobbinsContainer.classList.add('hidden');
      }
    }
  });
  
  // Save bobbin lot button click
  saveBobbinLotBtn.addEventListener('click', async function() {
    if (currentLotBobbins.length === 0) {
      alert('Please add at least one bobbin entry to the lot.');
      return;
    }
    
    const lotNumber = document.getElementById('bobbin-lot-number').value;
    const dateReceived = document.getElementById('bobbin-date-received').value;
    
    // Create lot data
    const lotData = {
      lot_number: lotNumber,
      date_received: dateReceived
    };
    
    // Create data object with both lot info and bobbins array
    const data = {
      lotData: lotData,
      bobbins: [...currentLotBobbins] // Create a copy of the array
    };
    
    console.log('About to save bobbin lot with data:', data);
    
    try {
      // Save the lot and all its bobbin entries
      const result = await window.api.createInboundBobbin(data);
      console.log('Save result:', result);
      
      alert(`Bobbin Lot ${lotNumber} with ${currentLotBobbins.length} entries created successfully!`);
      
      // Reset everything for the next lot
      currentLotBobbins = [];
      addedBobbinsTable.innerHTML = '';
      addedBobbinsContainer.classList.add('hidden');
      document.getElementById('bobbin-customer-name').selectedIndex = 0;
      document.getElementById('bobbin-type-inbound').selectedIndex = 0;
      document.getElementById('bobbin-quantity').value = '';
      
      // Get the next lot number
      await loadNextBobbinLotNumber();
      
      // Reload the lots history
      await loadBobbinLotsHistory();
    } catch (error) {
      console.error('Error creating bobbin lot:', error);
      alert('Error creating bobbin lot: ' + error);
    }
  });
  
  // Helper function to rebuild the bobbins table
  function rebuildBobbinsTable(bobbins) {
    const lotNumber = document.getElementById('bobbin-lot-number').value;
    
    // Clear the table
    addedBobbinsTable.innerHTML = '';
    
    // Rebuild with new indexes
    bobbins.forEach((bobbin, index) => {
      const tempBobbinId = `IB-${lotNumber}-${index + 1}`;
      
      const row = document.createElement('tr');
      row.setAttribute('data-index', index);
      row.innerHTML = `
        <td>${tempBobbinId}</td>
        <td>${bobbin.customer_name}</td>
        <td>${bobbin.bobbin_type}</td>
        <td>${bobbin.quantity}</td>
        <td>
          <button type="button" class="btn-delete remove-bobbin" data-index="${index}">Remove</button>
        </td>
      `;
      
      addedBobbinsTable.appendChild(row);
    });
  }
}

// Load next bobbin lot number
function loadNextBobbinLotNumber() {
  window.api.generateId('IB')
    .then(id => {
      document.getElementById('bobbin-lot-number').value = id;
    })
    .catch(error => {
      console.error('Error getting next bobbin lot number:', error);
      alert('Error getting next lot number: ' + error);
    });
}

// Load bobbin lots history
function loadBobbinLotsHistory() {
  const bobbinLotsHistoryTable = document.getElementById('bobbin-lots-history-table').querySelector('tbody');
  bobbinLotsHistoryTable.innerHTML = '';
  
  window.api.getInboundBobbins()
    .then(bobbins => {
      if (!bobbins || bobbins.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">No bobbin lots found.</td>';
        bobbinLotsHistoryTable.appendChild(row);
        return;
      }

      // Group bobbins by lot number
      const lotMap = {};
      
      bobbins.forEach(bobbin => {
        if (!bobbin.lot_no) return;
        
        if (!lotMap[bobbin.lot_no]) {
          lotMap[bobbin.lot_no] = {
            lot_number: bobbin.lot_no,
            date_received: bobbin.date_received,
            customer_name: bobbin.customer_name,
            total_bobbins: 0,
            entries: []
          };
        }
        
        lotMap[bobbin.lot_no].entries.push(bobbin);
        lotMap[bobbin.lot_no].total_bobbins += parseInt(bobbin.quantity) || 0;
      });
      
      // Convert to array and sort
      const lots = Object.values(lotMap);
      lots.sort((a, b) => {
        const aNum = a.lot_number ? parseInt(a.lot_number.split('-')[1]) : 0;
        const bNum = b.lot_number ? parseInt(b.lot_number.split('-')[1]) : 0;
        return bNum - aNum; // Descending order
      });
      
      // Take the most recent 10 lots
      const recentLots = lots.slice(0, 10);
      
      if (recentLots.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">No bobbin lots found.</td>';
        bobbinLotsHistoryTable.appendChild(row);
        return;
      }
      
      recentLots.forEach(lot => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${lot.lot_number}</td>
          <td>${lot.date_received}</td>
          <td>${lot.customer_name}</td>
          <td>${lot.total_bobbins}</td>
          <td>
            <button type="button" class="btn-view view-bobbin-lot-details" data-lot="${lot.lot_number}">View Details</button>
            <button type="button" class="btn-delete delete-bobbin-lot" data-lot="${lot.lot_number}">Delete</button>
          </td>
        `;
        bobbinLotsHistoryTable.appendChild(row);
      });
      
      // Add event listeners for view details and delete buttons
      document.querySelectorAll('.view-bobbin-lot-details').forEach(button => {
        button.addEventListener('click', function() {
          const lotNumber = this.getAttribute('data-lot');
          viewBobbinLotDetails(lotNumber);
        });
      });
      
      document.querySelectorAll('.delete-bobbin-lot').forEach(button => {
        button.addEventListener('click', function() {
          const lotNumber = this.getAttribute('data-lot');
          if (confirm(`Are you sure you want to delete Bobbin Lot ${lotNumber}? This will delete all bobbin entries in this lot.`)) {
            deleteBobbinLot(lotNumber);
          }
        });
      });
    })
    .catch(error => {
      console.error('Error loading bobbin lots history:', error);
      alert('Error loading bobbin lots history: ' + error);
    });
}

// View bobbin lot details
function viewBobbinLotDetails(lotNumber) {
  if (!lotNumber) {
    alert('Invalid lot number');
    return;
  }

  const modal = document.getElementById('bobbin-lot-details-modal');
  const modalTitle = document.getElementById('bobbin-modal-title');
  const lotSummary = document.getElementById('bobbin-lot-summary');
  const bobbinsTable = document.getElementById('bobbin-lot-details-table').querySelector('tbody');
  
  // Clear previous data
  bobbinsTable.innerHTML = '';
  lotSummary.innerHTML = '';
  
  // Get all bobbins in this lot
  window.api.getInboundBobbins()
    .then(allBobbins => {
      // Filter to get only bobbins from this lot
      const lotBobbins = allBobbins.filter(bobbin => bobbin.lot_no === lotNumber);
      
      if (lotBobbins.length === 0) {
        alert('No bobbins found for this lot number');
        return;
      }
      
      // Set modal title
      modalTitle.textContent = `Bobbin Lot ${lotNumber} Details`;
      
      // Calculate total quantity
      const totalQuantity = lotBobbins.reduce((sum, bobbin) => {
        return sum + (parseInt(bobbin.quantity) || 0);
      }, 0);
      
      // Set lot summary
      lotSummary.innerHTML = `
        <p><strong>Lot Number:</strong> ${lotNumber}</p>
        <p><strong>Date Received:</strong> ${lotBobbins[0].date_received || 'N/A'}</p>
        <p><strong>Customer:</strong> ${lotBobbins[0].customer_name || 'N/A'}</p>
        <p><strong>Total Bobbins:</strong> ${totalQuantity}</p>
      `;
      
      // Add rows for each bobbin entry
      lotBobbins.forEach(bobbin => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${bobbin.inbound_bobbin_id || 'N/A'}</td>
          <td>${bobbin.customer_name || 'N/A'}</td>
          <td>${bobbin.bobbin_type || 'N/A'}</td>
          <td>${bobbin.quantity || '0'}</td>
          <td>${bobbin.status || 'N/A'}</td>
        `;
        bobbinsTable.appendChild(row);
      });
      
      // Show the modal
      modal.classList.add('show');
      
      // Add event listener to close button
      document.querySelector('.close-modal-bobbin').addEventListener('click', function() {
        modal.classList.remove('show');
      });
      
      // Close modal when clicking outside
      modal.addEventListener('click', function(e) {
        if (e.target === this) {
          this.classList.remove('show');
        }
      });
    })
    .catch(error => {
      console.error('Error loading bobbin lot details:', error);
      alert('Error loading bobbin lot details: ' + error);
    });
}

// Delete bobbin lot
function deleteBobbinLot(lotNumber) {
  window.api.deleteInboundBobbin(lotNumber)
    .then(() => {
      alert(`Bobbin Lot ${lotNumber} deleted successfully!`);
      loadBobbinLotsHistory();
    })
    .catch(error => {
      console.error('Error deleting bobbin lot:', error);
      alert('Error deleting bobbin lot: ' + error);
    });
}

function setupMachineManagement() {
  const newMachineBtn = document.getElementById('new-machine-btn');
  const machineFormContainer = document.getElementById('machine-form-container');
  const machineForm = document.getElementById('machine-form');
  const cancelMachineBtn = document.getElementById('cancel-machine-btn');
  const machineFormTitle = document.getElementById('machine-form-title');
  
  // New machine button click
  newMachineBtn.addEventListener('click', function() {
    // Reset form
    machineForm.reset();
    document.getElementById('machine-id').value = '';
    
    // Show form
    machineFormContainer.classList.remove('hidden');
    machineFormTitle.textContent = 'New Machine';
    
    // Focus on first field
    document.getElementById('machine-number-input').focus();
  });
  
  // Cancel button click
  cancelMachineBtn.addEventListener('click', function() {
    machineFormContainer.classList.add('hidden');
    machineForm.reset();
  });
  
  // Form submission
  machineForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const machineId = document.getElementById('machine-id').value;
    const machineData = {
      machine_number: document.getElementById('machine-number-input').value,
      description: document.getElementById('machine-description').value || ''
    };
    
    console.log('Submitting machine data:', machineData);
    
    // Create or update machine
    if (!machineId) {
      // Create new machine
      window.api.createMachine(machineData)
        .then(() => {
          alert('Machine added successfully!');
          machineFormContainer.classList.add('hidden');
          machineForm.reset();
          loadMachines();
        })
        .catch(error => {
          console.error('Error adding machine:', error);
          alert('Error adding machine: ' + error);
        });
    } else {
      // Update existing machine
      window.api.updateMachine(machineId, machineData)
        .then(() => {
          alert('Machine updated successfully!');
          machineFormContainer.classList.add('hidden');
          machineForm.reset();
          loadMachines();
        })
        .catch(error => {
          alert('Error updating machine: ' + error);
        });
    }
  });
  
  // Initial load
  loadMachines();
}

function loadMachines() {
  const machinesTable = document.getElementById('machines-table').querySelector('tbody');
  machinesTable.innerHTML = '<tr><td colspan="4" class="text-center">Loading...</td></tr>';
  
  window.api.getMachines()
    .then(machines => {
      if (machines.length === 0) {
        machinesTable.innerHTML = '<tr><td colspan="4" class="text-center">No machines found.</td></tr>';
        return;
      }
      
      console.log('Loaded machines:', machines);
      machinesTable.innerHTML = '';
      
      machines.forEach(machine => {
        // Check if we have all required fields and provide defaults for missing ones
        const machineId = machine.machine_id || 'Unknown ID';
        const machineNumber = machine.machine_number || 'Unknown';
        const description = machine.description || '';
        
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${machineId}</td>
          <td>${machineNumber}</td>
          <td>${description}</td>
          <td>
            <button type="button" class="btn-edit" data-id="${machineId}">Edit</button>
            <button type="button" class="btn-delete" data-id="${machineId}">Delete</button>
          </td>
        `;
        machinesTable.appendChild(row);
      });
      
      // Add event listeners for edit and delete buttons
      machinesTable.querySelectorAll('.btn-edit').forEach(button => {
        button.addEventListener('click', function() {
          editMachine(this.getAttribute('data-id'));
        });
      });
      
      machinesTable.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function() {
          deleteMachine(this.getAttribute('data-id'));
        });
      });
    })
    .catch(error => {
      console.error('Error loading machines:', error);
      machinesTable.innerHTML = `<tr><td colspan="4" class="text-center">Error loading machines: ${error}</td></tr>`;
    });
}

function editMachine(machineId) {
  const machineFormContainer = document.getElementById('machine-form-container');
  const machineForm = document.getElementById('machine-form');
  const machineFormTitle = document.getElementById('machine-form-title');
  
  // Get machine details
  window.api.getMachineById(machineId)
    .then(machine => {
      if (machine) {
        // Fill the form with machine details
        document.getElementById('machine-id').value = machine.machine_id;
        document.getElementById('machine-number-input').value = machine.machine_number;
        document.getElementById('machine-description').value = machine.description || '';
        
        // Show form
        machineFormContainer.classList.remove('hidden');
        machineFormTitle.textContent = 'Edit Machine';
        
        // Focus on first field
        document.getElementById('machine-number-input').focus();
      } else {
        alert('Machine not found.');
      }
    })
    .catch(error => {
      alert('Error retrieving machine details: ' + error);
    });
}

function deleteMachine(machineId) {
  if (confirm('Are you sure you want to delete this machine?')) {
    window.api.deleteMachine(machineId)
      .then(() => {
        alert('Machine deleted successfully!');
        loadMachines();
      })
      .catch(error => {
        alert('Error deleting machine: ' + error);
      });
  }
}

// Printer Settings Screen Functions
function setupPrinterSettings() {
  const form = document.getElementById('printer-settings-form');
  const labelPrinterSelect = document.getElementById('label-printer');
  const invoicePrinterSelect = document.getElementById('invoice-printer');
  let currentPrinterSettings = null;

  // Show loading state
  const loadingOption = document.createElement('option');
  loadingOption.value = '';
  loadingOption.textContent = 'Loading printers...';
  labelPrinterSelect.innerHTML = '';
  invoicePrinterSelect.innerHTML = '';
  labelPrinterSelect.appendChild(loadingOption.cloneNode(true));
  invoicePrinterSelect.appendChild(loadingOption);

  // Function to populate dropdowns with dummy data
  const populateWithDummyPrinters = () => {
    // Clear the loading option
    labelPrinterSelect.innerHTML = '';
    invoicePrinterSelect.innerHTML = '';
    
    // Add the default empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Select Printer';
    labelPrinterSelect.appendChild(emptyOption.cloneNode(true));
    invoicePrinterSelect.appendChild(emptyOption.cloneNode(true));
    
    // Add dummy printers
    const dummyPrinters = [
      'Default Printer',
      'PDF Printer',
      'Microsoft Print to PDF',
      'Document Printer'
    ];
    
    dummyPrinters.forEach(printer => {
      const option = document.createElement('option');
      option.value = printer;
      option.textContent = printer;
      labelPrinterSelect.appendChild(option.cloneNode(true));
      invoicePrinterSelect.appendChild(option.cloneNode(true));
    });
    
    // Set the selected values based on settings
    if (currentPrinterSettings) {
      labelPrinterSelect.value = currentPrinterSettings.labelPrinter || '';
      invoicePrinterSelect.value = currentPrinterSettings.invoicePrinter || '';
    }
  };

  // Load current settings first
  window.api.getPrinterSettings()
    .then(settings => {
      // Store the settings for later use
      currentPrinterSettings = settings || { labelPrinter: '', invoicePrinter: '' };
      
      // Then load available printers
      return window.api.getAvailablePrinters();
    })
    .then(printers => {
      // Clear the loading option
      labelPrinterSelect.innerHTML = '';
      invoicePrinterSelect.innerHTML = '';
      
      // Add the default empty option
      const emptyOption = document.createElement('option');
      emptyOption.value = '';
      emptyOption.textContent = 'Select Printer';
      labelPrinterSelect.appendChild(emptyOption.cloneNode(true));
      invoicePrinterSelect.appendChild(emptyOption.cloneNode(true));
      
      // Add printer options
      if (printers && printers.length > 0) {
        printers.forEach(printer => {
          const option = document.createElement('option');
          option.value = printer;
          option.textContent = printer;
          labelPrinterSelect.appendChild(option.cloneNode(true));
          invoicePrinterSelect.appendChild(option);
        });
        
        // Set the selected values based on settings
        if (currentPrinterSettings) {
          labelPrinterSelect.value = currentPrinterSettings.labelPrinter || '';
          invoicePrinterSelect.value = currentPrinterSettings.invoicePrinter || '';
        }
      } else {
        // No printers found, populate with dummy printers
        populateWithDummyPrinters();
      }
    })
    .catch(error => {
      console.error('Error loading printer settings:', error);
      
      // Initialize with default settings if we couldn't load them
      if (!currentPrinterSettings) {
        currentPrinterSettings = { labelPrinter: '', invoicePrinter: '' };
      }
      
      // Show dummy printers on error
      populateWithDummyPrinters();
    });

  // Handle form submission
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const settings = {
      labelPrinter: labelPrinterSelect.value,
      invoicePrinter: invoicePrinterSelect.value
    };

    window.api.updatePrinterSettings(settings)
      .then(success => {
        if (success) {
          alert('Printer settings saved successfully!');
        } else {
          alert('Error saving printer settings. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error saving printer settings:', error);
        alert('Error saving printer settings. Please try again.');
      });
  });
}

// Print Test Screen Functions
function createPlaceholderImages() {
  // Create label test preview
  const labelCanvas = document.createElement('canvas');
  labelCanvas.width = 300;
  labelCanvas.height = 200;
  const labelCtx = labelCanvas.getContext('2d');
  
  // Draw label background
  labelCtx.fillStyle = '#ffffff';
  labelCtx.fillRect(0, 0, 300, 200);
  
  // Draw label border
  labelCtx.strokeStyle = '#000000';
  labelCtx.lineWidth = 2;
  labelCtx.strokeRect(5, 5, 290, 190);
  
  // Add label text
  labelCtx.fillStyle = '#000000';
  labelCtx.font = '16px Arial';
  labelCtx.textAlign = 'center';
  labelCtx.fillText('Label Test Preview', 150, 50);
  labelCtx.font = '12px Arial';
  labelCtx.fillText('This is a sample label layout', 150, 80);
  labelCtx.fillText('Date: ' + new Date().toLocaleDateString(), 150, 100);
  
  // Convert to data URL and set as image source
  const labelPreview = document.getElementById('label-test-preview');
  labelPreview.src = labelCanvas.toDataURL('image/png');
  
  // Create invoice test preview
  const invoiceCanvas = document.createElement('canvas');
  invoiceCanvas.width = 300;
  invoiceCanvas.height = 400;
  const invoiceCtx = invoiceCanvas.getContext('2d');
  
  // Draw invoice background
  invoiceCtx.fillStyle = '#ffffff';
  invoiceCtx.fillRect(0, 0, 300, 400);
  
  // Draw invoice border
  invoiceCtx.strokeStyle = '#000000';
  invoiceCtx.lineWidth = 2;
  invoiceCtx.strokeRect(5, 5, 290, 390);
  
  // Add invoice header
  invoiceCtx.fillStyle = '#000000';
  invoiceCtx.font = '20px Arial';
  invoiceCtx.textAlign = 'center';
  invoiceCtx.fillText('INVOICE', 150, 40);
  
  // Add invoice details
  invoiceCtx.font = '14px Arial';
  invoiceCtx.textAlign = 'left';
  invoiceCtx.fillText('Invoice No: TEST-001', 20, 80);
  invoiceCtx.fillText('Date: ' + new Date().toLocaleDateString(), 20, 100);
  
  // Add sample table
  invoiceCtx.strokeStyle = '#000000';
  invoiceCtx.lineWidth = 1;
  invoiceCtx.strokeRect(20, 120, 260, 200);
  
  // Add table headers
  invoiceCtx.fillStyle = '#000000';
  invoiceCtx.font = '12px Arial';
  invoiceCtx.fillText('Item', 30, 140);
  invoiceCtx.fillText('Quantity', 150, 140);
  invoiceCtx.fillText('Amount', 230, 140);
  
  // Add sample data
  invoiceCtx.fillText('Test Item 1', 30, 160);
  invoiceCtx.fillText('2', 150, 160);
  invoiceCtx.fillText('₹1000', 230, 160);
  
  // Add total
  invoiceCtx.font = '14px Arial';
  invoiceCtx.fillText('Total: ₹2000', 180, 350);
  
  // Convert to data URL and set as image source
  const invoicePreview = document.getElementById('invoice-test-preview');
  invoicePreview.src = invoiceCanvas.toDataURL('image/png');
}

// Update the setupPrintTest function to create placeholder images
function setupPrintTest() {
  // Create placeholder images
  createPlaceholderImages();
  
  const printLabelTestBtn = document.getElementById('print-label-test');
  const printInvoiceTestBtn = document.getElementById('print-invoice-test');

  printLabelTestBtn.addEventListener('click', async () => {
    try {
      // Get the label printer settings
      const settings = await window.api.getPrinterSettings();
      if (!settings || !settings.labelPrinter) {
        alert('Please configure the Label Printer in the Printer Settings module first.');
        return;
      }

      // Create test data for label
      const testData = {
        type: 'box',  // Changed from 'label' to 'box'
        data: {
          box_id: 'TEST-' + Date.now(),
          roll_id: 'TEST-ROLL',
          net_weight: 10.00,
          bobbin_count: 5,
          bobbin_type: 'Standard',
          date_created: new Date().toLocaleDateString()
        }
      };

      // Print using the configured label printer
      await window.api.printLabel(testData);
      alert('Label test print sent successfully!');
    } catch (error) {
      console.error('Error printing label test:', error);
      alert('Failed to print label test. Please check your printer settings and try again.');
    }
  });

  printInvoiceTestBtn.addEventListener('click', async () => {
    try {
      // Get the invoice printer settings
      const settings = await window.api.getPrinterSettings();
      if (!settings || !settings.invoicePrinter) {
        alert('Please configure the Invoice Printer in the Printer Settings module first.');
        return;
      }

      // Create test data for invoice
      const testData = {
        type: 'dispatch',  // Changed from 'invoice' to 'dispatch'
        data: {
          dispatch_id: 'TEST-' + Date.now(),
          dispatch_date: new Date().toLocaleDateString(),
          customer_name: 'Test Customer',
          total_weight: 10.00,
          total_bobbins: 5,
          boxes: [{
            box_id: 'TEST-BOX-1',
            roll_id: 'TEST-ROLL-1',
            net_weight: 10.00,
            bobbin_count: 5
          }]
        }
      };

      // Print using the configured invoice printer
      await window.api.printLabel(testData);
      alert('Invoice test print sent successfully!');
    } catch (error) {
      console.error('Error printing invoice test:', error);
      alert('Failed to print invoice test. Please check your printer settings and try again.');
    }
  });
} 