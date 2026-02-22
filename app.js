// ===== APPLICATION LOGIC =====

// ===== PAGE NAVIGATION =====

function goToDashboard() {
    showPage('dashboardPage');
    renderDashboard();
}

function goToCreateProperty() {
    showPage('createPropertyPage');
    clearCreatePropertyForm();
}

function goToRooms(propertyId = null) {
    if (propertyId) {
        currentPropertyId = propertyId;
    }
    if (!currentPropertyId) {
        alert('No property selected');
        return;
    }
    showPage('roomsPage');
    renderRoomsPage();
}

function goToInvoice() {
    if (!currentPropertyId) {
        alert('No property selected');
        return;
    }
    showPage('invoicePage');
    renderInvoicePage();
}

function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
    window.scrollTo(0, 0);
}

// ===== DASHBOARD PAGE =====

function renderDashboard() {
    const propertiesList = document.getElementById('propertiesList');
    propertiesList.innerHTML = '';

    propertiesDatabase.forEach(property => {
        const totalCost = calculatePropertyTotal(property);
        const card = document.createElement('div');
        card.className = 'property-card';

     
        card.innerHTML = `
            
            <div class="property-card-info-section" onclick="goToRooms('${property.firebaseId}')">
                <div class="property-card-header">
                    <div class="property-card-title">${property.clientName}</div>
                    <div class="property-card-type">${property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}</div>
                </div>
                <div class="property-card-info">📍 ${property.location}</div>
                <div class="property-card-info">📐 ${property.totalArea} m²</div>
                ${property.clientPhone ? `<div class="property-card-phone">📞 ${property.clientPhone}</div>` : ''}
                <div class="property-card-cost">Total: ${totalCost.toLocaleString()} EGP</div>
            </div>
            <div class="property-card-actions">
                <button class="btn btn-edit btn-small" onclick="event.stopPropagation(); openEditPropertyModal('${property.firebaseId}')">✏️ Edit</button>
                <button class="btn btn-danger btn-small" onclick="event.stopPropagation(); deleteProperty('${property.firebaseId}')">🗑️ Delete</button>
            </div>
        `;
        propertiesList.appendChild(card);
    });
}

function clearCreatePropertyForm() {
    document.getElementById('clientName').value = '';
    document.getElementById('clientPhone').value = '';
    document.getElementById('propertyType').value = '';
    document.getElementById('propertyLocation').value = '';
    document.getElementById('propertyArea').value = '';
}

function saveProperty() {
    const clientName = document.getElementById('clientName').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const propertyType = document.getElementById('propertyType').value;
    const location = document.getElementById('propertyLocation').value.trim();
    const totalArea = parseFloat(document.getElementById('propertyArea').value) || 0;

    if (!clientName || !propertyType) {
        alert('Please fill in all required fields (Client Name and Property Type)');
        return;
    }


        createNewProperty(clientName, clientPhone, propertyType, location, totalArea);
    
}

async function createNewProperty(clientName, clientPhone, propertyType, location, totalArea) {
    const { collection, addDoc } = window.fbMethods;
    
    const newProperty = {
        clientName: clientName,
        clientPhone: clientPhone,
        propertyType: propertyType,
        location: location,
        totalArea: totalArea,
        rooms: [],
        createdAt: new Date()
    };

    const roomTypes = ROOM_TYPES[propertyType] || [];
    roomTypes.forEach((roomType, index) => {
        newProperty.rooms.push({
            id: index + 1, 
            name: roomType,
            floor: 'Ground',
            type: roomType,
            devices: []
        });
    });

    try {
        const docRef = await addDoc(collection(window.db, "properties"), newProperty);
        currentPropertyId = docRef.id;
        goToRooms();
    } catch (e) {
        alert("Error saving to cloud: " + e.message);
    }
}

// ===== EDIT PROPERTY FUNCTIONALITY =====

let editingPropertyId = null;

function openEditPropertyModal(propertyId) {
    const property = getPropertyById(propertyId);
    if (!property) return;

    editingPropertyId = propertyId;
    document.getElementById('editPropertyClientName').value = property.clientName;
    document.getElementById('editPropertyClientPhone').value = property.clientPhone;
    document.getElementById('editPropertyType').value = property.propertyType;
    document.getElementById('editPropertyLocation').value = property.location;
    document.getElementById('editPropertyArea').value = property.totalArea;

    document.getElementById('editPropertyModal').classList.add('active');
}

function closeEditPropertyModal() {
    document.getElementById('editPropertyModal').classList.remove('active');
    editingPropertyId = null;
}

async function saveEditedProperty() {
    if (!editingPropertyId) return;
    const { doc, updateDoc } = window.fbMethods;

    const clientName = document.getElementById('editPropertyClientName').value.trim();
    const propertyType = document.getElementById('editPropertyType').value;
    const location = document.getElementById('editPropertyLocation').value.trim();
    const totalArea = parseFloat(document.getElementById('editPropertyArea').value) || 0;

    if (!clientName || !propertyType) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const propertyRef = doc(window.db, "properties", editingPropertyId);
        await updateDoc(propertyRef, {
            clientName,
            propertyType,
            location,
            totalArea,
            clientPhone: document.getElementById('editPropertyClientPhone').value.trim()
        });
        
        closeEditPropertyModal();
        alert('Property updated in Cloud!');
    } catch (e) {
        console.error("Error updating property:", e);
        alert("Failed to sync edit to cloud.");
    }
}

function deleteProperty(propertyId) {
    if (confirm('Are you sure you want to delete this property and all its data?')) {
        propertiesDatabase = propertiesDatabase.filter(p => p.id !== propertyId);
        saveDataToLocalStorage();
        renderDashboard();
        alert('Property deleted successfully!');
    }
}

// ===== ROOMS PAGE =====

function renderRoomsPage() {
    const property = getPropertyById(currentPropertyId);
    if (!property) {
        alert('Property not found');
        goToDashboard();
        return;
    }

    // Set current room to first room if not set
    if (!currentRoomId && property.rooms.length > 0) {
        currentRoomId = property.rooms[0].id;
    }

    // Render room tabs
    renderRoomTabs(property);

    // Render current room details
    renderCurrentRoom(property);

    // Render device categories
    renderDeviceCategories(property);

    // Update property total cost
    const totalCost = calculatePropertyTotal(property);
    document.getElementById('propertyTotalCost').textContent = totalCost.toLocaleString() + ' EGP';
}

function renderRoomTabs(property) {
    const roomTabs = document.getElementById('roomTabs');
    roomTabs.innerHTML = '';

    property.rooms.forEach(room => {
        const tab = document.createElement('div');
        tab.className = 'room-tab' + (room.id === currentRoomId ? ' active' : '');
        tab.textContent = room.name;
        tab.onclick = () => switchRoom(tab, room.id);
        roomTabs.appendChild(tab);
    });
}

function switchRoom(element, roomId) {
    document.querySelectorAll('.room-tab').forEach(tab => tab.classList.remove('active'));
    element.classList.add('active');
    currentRoomId = roomId;
    renderRoomsPage();
}

function renderCurrentRoom(property) {
    const room = property.rooms.find(r => r.id === currentRoomId);
    if (!room) return;

    // Update room header
    document.getElementById('currentRoomTitle').textContent = room.name;
    document.getElementById('currentRoomInfo').textContent = `📍 ${room.floor} Floor - ${room.type}`;

    const roomTotal = calculateRoomTotal(room);
    document.getElementById('roomTotalCost').textContent = `Room Total: ${roomTotal.toLocaleString()} EGP`;
    
    // Update property total cost
    const totalCost = calculatePropertyTotal(property);
    document.getElementById('propertyTotalCost').textContent = totalCost.toLocaleString() + ' EGP';
}

function renderDeviceCategories(property) {
    const room = property.rooms.find(r => r.id === currentRoomId);
    if (!room) return;

    const container = document.getElementById('deviceCategoriesContainer');
    container.innerHTML = '';

    Object.keys(DEVICE_CATEGORIES).forEach(categoryKey => {
        const categoryInfo = DEVICE_CATEGORIES[categoryKey];
        const categoryDevices = devicesDatabase.filter(d => d.category === categoryKey && d.active);

        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'device-category';

        let categoryHtml = `
            <div class="device-category-title">
                <div class="device-category-icon">${categoryInfo.icon}</div>
                ${categoryInfo.name}
            </div>
        `;

        // Display existing devices in this room for this category
        room.devices.forEach(roomDevice => {
            const device = getDeviceById(roomDevice.deviceId);
            if (device && device.category === categoryKey) {
                const total = device.price * roomDevice.quantity;
                categoryHtml += `
                    <div class="device-item">
                        <div class="device-item-header">
                            <div class="device-item-name">${device.name}</div>
                            <div class="device-item-price">${device.price.toLocaleString()} EGP</div>
                        </div>
                        <div class="device-item-details">Brand: ${device.brand} | Protocol: ${device.protocol}</div>
                        <div class="device-item-quantity">
                            <label>Qty:</label>
                            <input type="number" value="${roomDevice.quantity}" min="1" 
                                onchange="updateDeviceQuantity(${currentRoomId}, ${roomDevice.deviceId}, this.value)">
                            <span class="device-item-total">Total: ${total.toLocaleString()} EGP</span>
                            <button class="btn btn-danger btn-small" onclick="removeDeviceFromRoom(${currentRoomId}, '${roomDevice.deviceId}')" style="margin-left: 0.5rem;">Remove</button>                        </div>
                    </div>
                `;
            }
        });

        // Add device form
        categoryHtml += `
            <div class="device-add-form">
                <div class="device-add-form-row full">
                    <select class="form-select" id="select-${categoryKey}" onchange="updateAddDeviceQuantity('${categoryKey}')">
                        <option value="">Select a ${categoryInfo.name.toLowerCase()} device...</option>
        `;

        categoryDevices.forEach(device => {
            categoryHtml += `<option value="${device.firebaseId}">${device.name} (${device.price.toLocaleString()} EGP)</option>`;   });

        categoryHtml += `
                    </select>
                </div>
                <div class="device-add-form-row">
                    <input type="number" id="qty-${categoryKey}" placeholder="Quantity" min="1" value="1">
                    <button class="btn btn-primary" style="margin-top: 0;" onclick="addDeviceToRoom('${categoryKey}')">Add Device</button>
                </div>
            </div>
        `;

        categoryDiv.innerHTML = categoryHtml;
        container.appendChild(categoryDiv);
    });
}

async function addDeviceToRoom(categoryKey) {
    const { doc, updateDoc } = window.fbMethods;
    const selectElement = document.getElementById(`select-${categoryKey}`);
    const qtyElement = document.getElementById(`qty-${categoryKey}`);
    
    const deviceId = selectElement.value;
    const quantity = parseInt(qtyElement.value) || 1;

    if (!deviceId) {
        alert('Please select a device');
        return;
    }

    const property = getPropertyById(currentPropertyId);
    if (!property) return; 

    const room = property.rooms.find(r => r.id == currentRoomId);
    if (!room) return; 

    const existingDevice = room.devices.find(d => d.deviceId == deviceId);
    
    if (existingDevice) {
        existingDevice.quantity += quantity;
    } else {
        room.devices.push({ deviceId: deviceId, quantity: quantity });
    }

    try {
        const propertyRef = doc(window.db, "properties", currentPropertyId);
        await updateDoc(propertyRef, {
            rooms: property.rooms
        });
        
        renderDeviceCategories(property);
        renderCurrentRoom(property);
    } catch (error) {
        console.error("Error updating room:", error);
        alert("Could not save to cloud.");
    }
}

function toggleRoomInput() {
    const container = document.getElementById('newRoomInputContainer');
    const input = document.getElementById('newRoomNameInput');
    
    if (container.style.display === 'none') {
        container.style.display = 'block';
        input.focus();
    } else {
        container.style.display = 'none';
        input.value = '';
    }
}

async function addNewRoomToProperty() {
    const { doc, updateDoc } = window.fbMethods;
    const roomNameInput = document.getElementById('newRoomNameInput');
    const roomName = roomNameInput.value.trim();

    if (!roomName) {
        alert("Please enter a room name");
        return;
    }

    const property = getPropertyById(currentPropertyId);
    if (!property) return;

    const newRoom = {
        id: Date.now(),
        name: roomName,
        floor: 'Ground',
        type: 'Custom',
        devices: [] 
    };

    property.rooms.push(newRoom);

    try {
        const propertyRef = doc(window.db, "properties", currentPropertyId);
        await updateDoc(propertyRef, {
            rooms: property.rooms
        });

        roomNameInput.value = '';
        toggleRoomInput();
        currentRoomId = newRoom.id;
        renderRoomsPage();
    } catch (error) {
        console.error("Error adding room:", error);
        alert("Failed to save room to Cloud.");
    }
}
function updateDeviceQuantity(roomId, deviceId, newQuantity) {
    const property = getPropertyById(currentPropertyId);
    const room = property.rooms.find(r => r.id === roomId);
    const roomDevice = room.devices.find(d => d.deviceId === deviceId);

    if (roomDevice) {
        const qty = parseInt(newQuantity) || 1;
        if (qty <= 0) {
            room.devices = room.devices.filter(d => d.deviceId !== deviceId);
        } else {
            roomDevice.quantity = qty;
        }
        saveDataToLocalStorage();
        renderDeviceCategories(property);
        renderCurrentRoom(property);
        
        // Update property total
        const totalCost = calculatePropertyTotal(property);
        document.getElementById('propertyTotalCost').textContent = totalCost.toLocaleString() + ' EGP';
    }
}

function removeDeviceFromRoom(roomId, deviceId) {
    const property = getPropertyById(currentPropertyId);
    const room = property.rooms.find(r => r.id === roomId);
    
    if (room) {
        room.devices = room.devices.filter(d => d.deviceId !== deviceId);
        saveDataToLocalStorage();
        renderDeviceCategories(property);
        renderCurrentRoom(property);
        
        // Update property total
        const totalCost = calculatePropertyTotal(property);
        document.getElementById('propertyTotalCost').textContent = totalCost.toLocaleString() + ' EGP';
    }
}

function updateAddDeviceQuantity(categoryKey) {
    const selectElement = document.getElementById(`select-${categoryKey}`);
    const device = getDeviceById(parseInt(selectElement.value));
    if (device) {
        const qtyElement = document.getElementById(`qty-${categoryKey}`);
    }
}

// ===== INVOICE PAGE =====

function renderInvoicePage() {
    const property = getPropertyById(currentPropertyId);
    if (!property) {
        alert('Property not found');
        goToDashboard();
        return;
    }
    
    const invoiceSummary = document.getElementById('invoiceSummary');
    invoiceSummary.innerHTML = '';
    let totalAmount = 0;
    
    property.rooms.forEach(room => {
        const roomTotal = calculateRoomTotal(room);
        totalAmount += roomTotal;
        
        const roomDiv = document.createElement('div');
        roomDiv.className = 'invoice-room';
        
        let roomHtml = `<div class="invoice-room-title">${room.name}</div>`;
        
        room.devices.forEach(roomDevice => {
            const device = getDeviceById(roomDevice.deviceId);
            if (device) {
                const lineTotal = device.price * roomDevice.quantity;
                roomHtml += `
                    <div class="invoice-device-line">
                        <span>${device.name} (Qty: ${roomDevice.quantity})</span>
                        <span class="invoice-device-line-total">${lineTotal.toLocaleString()} EGP</span>
                        <button class="btn btn-danger btn-small" onclick="removeDeviceFromInvoice(${room.id}, '${roomDevice.deviceId}')" style="margin-left: 0.5rem;">Remove</button>                    </div>
                `;
            }
        });
        
        roomHtml += `
            <div class="invoice-device-line" style="font-weight: bold; border-top: 1px solid rgba(0, 212, 255, 0.2); padding-top: 0.5rem; margin-top: 0.5rem;">
                <span>Room Total:</span>
                <span>${roomTotal.toLocaleString()} EGP</span>
            </div>
        `;

        roomDiv.innerHTML = roomHtml;
        invoiceSummary.appendChild(roomDiv);
    });
    
    document.getElementById('invoiceTotalAmount').textContent = totalAmount.toLocaleString() + ' EGP';
}

async function removeDeviceFromInvoice(roomId, deviceId) {
    const { doc, updateDoc } = window.fbMethods;
    const property = getPropertyById(currentPropertyId);
    
    // Find the specific room
    const room = property.rooms.find(r => r.id === roomId);
    
    if (room) {
        // Filter out the device locally
        room.devices = room.devices.filter(d => d.deviceId !== deviceId);
        
        try {
            // Sync the change to the Cloud
            const propertyRef = doc(window.db, "properties", currentPropertyId);
            await updateDoc(propertyRef, {
                rooms: property.rooms
            });
            
            renderInvoicePage();
        } catch (error) {
            console.error("Error removing device from invoice:", error);
            alert("Could not update cloud database.");
        }
    }
}
async function generatePDF() {
    if (typeof html2pdf === 'undefined') {
        alert("The PDF library is being blocked by your browser settings.");
        return;
    }
    const property = getPropertyById(currentPropertyId);
    if (!property) return;

    const element = document.createElement('div');
    element.style.cssText = `
        background: #0a0e14; 
        color: white; 
        font-family: sans-serif; 
        width: 210mm; 
        margin: 0; 
        padding: 0;
    `;

    const generationDate = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'numeric', year: 'numeric'
    });

    const pageStyle = `
        height: 296.5mm; 
        width: 210mm; 
        box-sizing: border-box; 
        padding: 40px; 
        position: relative; 
        overflow: hidden;
    `;

    // --- PAGE 1: COVER ---
    let html = `
        <div style="${pageStyle} display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
            <div style="border: 5px solid #00d4ff; width: 95%; height: 95%; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;">
                <img src="https://raw.githubusercontent.com/Farah-1/housbot/main/hausbot_background.jpg" style="max-width: 200px; margin-bottom: 40px;">
                <h1 style="color: #00d4ff; font-size: 3.5rem; text-transform: uppercase; letter-spacing: 5px; margin: 0;">Proforma Invoice</h1>
                <p style="font-size: 1.2rem; opacity: 0.8; margin-top: 10px;">Smart Home Solutions & Automation Services</p>
                <div style="margin-top: 60px; text-align: left; width: 60%; border-top: 1px solid rgba(0,212,255,0.3); padding-top: 20px;">
                    <p><strong>Company:</strong> HAUSBOT</p>
                    <p><strong>Date:</strong> ${generationDate}</p>
                    <p><strong>Ref No:</strong> ${Math.floor(Math.random() * 100)}</p>
                </div>
            </div>
        </div>

        <div style="${pageStyle}">
            <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">About HAUSBOT</h2>
            <h3 style="margin-top: 30px;">Who We Are</h3>
            <p style="line-height: 1.8; opacity: 0.9;">HAUSBOT is a premier provider of cutting-edge smart home solutions. We specialize in transforming living spaces into intelligent environments that enhance comfort, security, and efficiency.</p>
            <h3 style="color: #00d4ff; margin-top: 40px;">Our Core Services</h3>
            <ul style="list-style: none; padding: 0; line-height: 2;">
                <li>🔊 High-quality sound systems and immersive home theater setups.</li>
                <li>🛡️ Advanced intrusion alarms and comprehensive security systems.</li>
                <li>💡 Full home automation, smart lighting, and climate control.</li>
                <li>⚙️ Custom integration and smart device management.</li>
            </ul>
            <h3 style="color: #00d4ff; margin-top: 40px;">Our Mission</h3>
            <p style="opacity: 0.9;">To achieve your dreams and provide the better life you deserve through seamless technology integration.</p>
        </div>

        <div style="${pageStyle}">
            <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">Client & Project Details</h2>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px;">
                <div>
                    <h3 style="color: #00d4ff;">Bill To</h3>
                    <p><strong>Client Name:</strong><br>${property.clientName}</p>
                    <p><strong>Address:</strong><br>${property.location}</p>
                    <p><strong>Contact:</strong><br>${property.clientPhone}</p>
                </div>
      
            </div>
        </div>
    `;

    // --- PAGE 4: HARDWARE QUOTATION ---
    html += `
        <div style="padding: 40px; min-height: 296.5mm; box-sizing: border-box;">
            <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">Hardware Quotation</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background: rgba(0,212,255,0.2); text-align: left;">
                        <th style="padding: 15px; border: 1px solid #00d4ff;">Item Description</th>
                        <th style="padding: 15px; border: 1px solid #00d4ff;">Qty</th>
                        <th style="padding: 15px; border: 1px solid #00d4ff;">Unit Price</th>
                        <th style="padding: 15px; border: 1px solid #00d4ff; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
    `;

    property.rooms.forEach(room => {
        room.devices.forEach(roomDevice => {
            const device = getDeviceById(roomDevice.deviceId);
            if (device) {
                html += `
                    <tr style="page-break-inside: avoid;">
                        <td style="padding: 15px; border: 1px solid rgba(0,212,255,0.3); font-size: 0.9rem;">
                            <strong>${device.name}</strong><br>
                            <small style="opacity: 0.6;">${room.name} | ${device.brand}</small>
                        </td>
                        <td style="padding: 15px; border: 1px solid rgba(0,212,255,0.3);">${roomDevice.quantity}</td>
                        <td style="padding: 15px; border: 1px solid rgba(0,212,255,0.3);">${device.price.toLocaleString()}</td>
                        <td style="padding: 15px; border: 1px solid rgba(0,212,255,0.3); text-align: right;">${(device.price * roomDevice.quantity).toLocaleString()} EGP</td>
                    </tr>
                `;
            }
        });
    });

    const total = calculatePropertyTotal(property);
    html += `
                </tbody>
            </table>
            <div style="margin-top: 30px; text-align: right; background: rgba(0,212,255,0.1); padding: 20px; page-break-inside: avoid;">
                <h3 style="margin: 0;">Hardware Subtotal: <span style="color: #00d4ff;">${total.toLocaleString()} EGP</span></h3>
            </div>
        </div>
    `;

    // --- PAGE 5: SERVICES & INSTALLATION ---
    html += `
        <div style="${pageStyle}">
            <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">Services & Installation</h2>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tr style="border-bottom: 1px solid rgba(0,212,255,0.3);">
                    <td style="padding: 20px;">Professional Installation & Configuration</td>
                    <td style="text-align: right; color: #00d4ff; font-weight: bold;">INCLUDED</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(0,212,255,0.3);">
                    <td style="padding: 20px;">System Programming & Integration</td>
                    <td style="text-align: right; color: #00d4ff; font-weight: bold;">INCLUDED</td>
                </tr>
                <tr style="border-bottom: 1px solid rgba(0,212,255,0.3);">
                    <td style="padding: 20px;">After-Sales Support & Maintenance (1 Year)</td>
                    <td style="text-align: right; color: #00d4ff; font-weight: bold;">INCLUDED</td>
                </tr>
            </table>
            <p style="margin-top: 40px; font-style: italic; opacity: 0.7; line-height: 1.6;">
                All services are performed by HAUSBOT Certified Technicians to ensure the highest quality of integration and performance.
            </p>
        </div>
    `;

    // --- PAGE 6: FINANCIAL SUMMARY ---
    html += `
        <div style="${pageStyle} display: flex; flex-direction: column; justify-content: center;">
            <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px; margin-bottom: 40px;">Financial Summary</h2>
            <div style="background: rgba(255,255,255,0.05); padding: 30px; border-radius: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 1.2rem;">
                    <span>Total Hardware Components:</span>
                    <span>${total.toLocaleString()} EGP</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 1.2rem;">
                    <span>Total Services & Installation:</span>
                    <span style="color: #00d4ff;">FREE</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 1.2rem;">
                    <span>Value Added Tax (VAT):</span>
                    <span>0 EGP</span>
                </div>
                <div style="border-top: 2px solid #00d4ff; margin-top: 20px; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <h1 style="margin: 0; font-size: 2.5rem; color: #00d4ff;">Grand Total</h1>
                    <h1 style="margin: 0; font-size: 2.5rem; color: #00d4ff;">${total.toLocaleString()} EGP</h1>
                </div>
            </div>
            <p style="text-align: center; margin-top: 30px; opacity: 0.6;">Inclusive of all taxes and services</p>
        </div>
    `;

    // --- PAGE 7: PAYMENT SCHEDULE ---
    html += `
        <div style="${pageStyle}">
            <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">Payment Terms & Schedule</h2>
            <div style="margin-top: 50px;">
                <div style="display: flex; align-items: center; margin-bottom: 40px;">
                    <div style="background: #00d4ff; color: black; padding: 20px; font-size: 2rem; font-weight: bold; min-width: 100px; text-align: center; border-radius: 10px;">50%</div>
                    <div style="margin-left: 30px;">
                        <h3 style="margin: 0; color: #00d4ff;">Down Payment</h3>
                        <p style="margin: 5px 0 0 0; opacity: 0.8;">Required upon signing the proforma invoice.</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center; margin-bottom: 40px;">
                    <div style="background: #00d4ff; color: black; padding: 20px; font-size: 2rem; font-weight: bold; min-width: 100px; text-align: center; border-radius: 10px;">40%</div>
                    <div style="margin-left: 30px;">
                        <h3 style="margin: 0; color: #00d4ff;">Hardware Delivery</h3>
                        <p style="margin: 5px 0 0 0; opacity: 0.8;">Due upon hardware arrival at the installation site.</p>
                    </div>
                </div>
                <div style="display: flex; align-items: center;">
                    <div style="background: #00d4ff; color: black; padding: 20px; font-size: 2rem; font-weight: bold; min-width: 100px; text-align: center; border-radius: 10px;">10%</div>
                    <div style="margin-left: 30px;">
                        <h3 style="margin: 0; color: #00d4ff;">Final Handover</h3>
                        <p style="margin: 5px 0 0 0; opacity: 0.8;">Payable after successful testing and client handover.</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- PAGE 8: TERMS & CONTACT ---
    html += `
        <div style="${pageStyle}">
            <h2 style="color: #00d4ff; border-bottom: 2px solid #00d4ff; padding-bottom: 10px;">Terms & Conditions</h2>
            <div style="margin-top: 30px;">
                <h3 style="color: #00d4ff;">Validity</h3>
                <p>This proforma invoice is valid for 90 days from the date of issuance.</p>
                <h3 style="color: #00d4ff; margin-top: 30px;">Warranty</h3>
                <p>We provide a 2-year comprehensive warranty on all hardware components.</p>
                <div style="background: rgba(255,0,0,0.1); border-left: 5px solid red; padding: 20px; margin-top: 40px;">
                    <strong>! Important Notes:</strong><br>
                    Final prices are subject to change based on a final site survey.
                </div>
            </div>
        </div>

        <div style="${pageStyle} display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
            <h2 style="color: #00d4ff; font-size: 2.5rem;">Need Help?</h2>
            <p style="font-size: 1.5rem; margin-top: 20px;">Call Us</p>
            <div style="border: 2px solid #00d4ff; padding: 20px 40px; border-radius: 50px; font-size: 2rem; color: #00d4ff; margin-top: 20px;">
                +20 10 40743437
            </div>
            <img src="https://raw.githubusercontent.com/Farah-1/housbot/main/hausbot_background.jpg" style="max-width: 150px; margin-top: 60px; opacity: 0.5;">
        </div>
    `;

    element.innerHTML = html;

    const opt = {
        margin: 0,
        filename: `${property.clientName}_Proforma_Invoice.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2, 
            backgroundColor: '#0a0e14', 
            useCORS: true,
            scrollY: 0,
            scrollX: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: 'avoid-all' }
    };

    try {
        await html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error("PDF Error:", err);
    }
}



// ===== SETTINGS MODAL =====

function openSettingsModal() {
    document.getElementById('settingsModal').classList.add('active');
    renderDevicesList();
}

function closeSettingsModal() {
    document.getElementById('settingsModal').classList.remove('active');
}

function renderDevicesList() {
    const devicesList = document.getElementById('devicesList');
    devicesList.innerHTML = '';

    devicesDatabase.forEach(device => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'device-list-item';

itemDiv.innerHTML = `
    ...
<button class="btn btn-danger btn-small" onclick="deleteDevice('${device.firebaseId || device.id}')">Delete</button>    ...
`;

        devicesList.appendChild(itemDiv);
    });
}

function openAddDeviceModal() {
    document.getElementById('addDeviceModal').classList.add('active');
    clearAddDeviceForm();
}

function closeAddDeviceModal() {
    document.getElementById('addDeviceModal').classList.remove('active');
}

function clearAddDeviceForm() {
    document.getElementById('newDeviceName').value = '';
    document.getElementById('newDeviceCategory').value = '';
    document.getElementById('newDeviceBrand').value = '';
    document.getElementById('newDeviceProtocol').value = '';
    document.getElementById('newDevicePrice').value = '';
    document.getElementById('newDeviceSupplier').value = '';
}


async function addNewDevice() {
    const { collection, addDoc } = window.fbMethods;
    const name = document.getElementById('newDeviceName').value.trim();
    const category = document.getElementById('newDeviceCategory').value;
    const price = parseFloat(document.getElementById('newDevicePrice').value) || 0;

    if (!name || !category || !price) {
        alert('Please fill in all required fields');
        return;
    }

    const newDevice = {
        name: name,
        category: category,
        brand: document.getElementById('newDeviceBrand').value.trim(),
        protocol: document.getElementById('newDeviceProtocol').value.trim(),
        price: price,
        supplier: document.getElementById('newDeviceSupplier').value.trim(),
        active: true,
        createdAt: new Date()
    };

    try {
        await addDoc(collection(window.db, "devices"), newDevice);
        closeAddDeviceModal();
        alert('Device added to Cloud Database!');
    } catch (e) {
        console.error("Error adding device: ", e);
    }
}

function openEditDeviceModal(deviceId) {
    const device = getDeviceById(deviceId);
    if (!device) return;

    editingDeviceId = deviceId;
    document.getElementById('editDeviceName').value = device.name;
    document.getElementById('editDevicePrice').value = device.price;
    document.getElementById('editDeviceBrand').value = device.brand;
    document.getElementById('editDeviceProtocol').value = device.protocol;
    document.getElementById('editDeviceSupplier').value = device.supplier;

    document.getElementById('editDeviceModal').classList.add('active');
}

function closeEditDeviceModal() {
    document.getElementById('editDeviceModal').classList.remove('active');
    editingDeviceId = null;
}

async function saveEditedDevice() {
    if (!editingDeviceId) return;
    const { doc, updateDoc } = window.fbMethods;

    const name = document.getElementById('editDeviceName').value.trim();
    const price = parseFloat(document.getElementById('editDevicePrice').value) || 0;

    try {
        const deviceRef = doc(window.db, "devices", editingDeviceId);
        await updateDoc(deviceRef, {
            name: name,
            price: price,
            brand: document.getElementById('editDeviceBrand').value.trim(),
            protocol: document.getElementById('editDeviceProtocol').value.trim(),
            supplier: document.getElementById('editDeviceSupplier').value.trim()
        });

        closeEditDeviceModal();
        alert('Device updated in Cloud!');
    } catch (e) {
        console.error("Error updating device:", e);
    }
}

function deleteDevice(deviceId) {
    if (confirm('Are you sure you want to delete this device?')) {
        devicesDatabase = devicesDatabase.filter(d => d.id !== deviceId);
        saveDataToLocalStorage();
        renderDevicesList();
        alert('Device deleted successfully!');
    }
}
// ===== BACKGROUND IMAGE =====

function updateBackgroundImage() {
    const url = document.getElementById('backgroundImageUrl').value.trim();
    if (!url) {
        alert('Please enter a valid image URL');
        return;
    }

    backgroundImageUrl = url;
    document.body.style.backgroundImage = `url('${url}')`;
    saveDataToLocalStorage();
    alert('Background image updated successfully!');
}

// ===== INITIALIZATION =====

document.addEventListener('DOMContentLoaded', function() {
    // Set initial background image
    document.body.style.backgroundImage = `url('${backgroundImageUrl}')`;
    document.getElementById('backgroundImageUrl').value = backgroundImageUrl;
    // Close modals when clicking outside
    window.onclick = function(event) {
        const settingsModal = document.getElementById('settingsModal');
        const addDeviceModal = document.getElementById('addDeviceModal');
        const editDeviceModal = document.getElementById('editDeviceModal');
        const editPropertyModal = document.getElementById('editPropertyModal');

        if (event.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
        if (event.target === addDeviceModal) {
            addDeviceModal.classList.remove('active');
        }
        if (event.target === editDeviceModal) {
            editDeviceModal.classList.remove('active');
        }
        if (event.target === editPropertyModal) {
            editPropertyModal.classList.remove('active');
        }
    };

    console.log('Smart Home Survey App Initialized');
});
// ===== INITIALIZATION =====



document.addEventListener('DOMContentLoaded', async function() {
   document.body.style.backgroundImage = `url('${backgroundImageUrl}')`;
    if (document.getElementById('backgroundImageUrl')) {
        document.getElementById('backgroundImageUrl').value = backgroundImageUrl;
    }
    if (typeof initFirebaseSync === 'function') {
        initFirebaseSync();
    }



    // 3. Close modals when clicking outside the content box
    window.onclick = function(event) {
        const settingsModal = document.getElementById('settingsModal');
        const addDeviceModal = document.getElementById('addDeviceModal');
        const editDeviceModal = document.getElementById('editDeviceModal');
        const editPropertyModal = document.getElementById('editPropertyModal');

        if (event.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
        if (event.target === addDeviceModal) {
            addDeviceModal.classList.remove('active');
        }
        if (event.target === editDeviceModal) {
            editDeviceModal.classList.remove('active');
        }
        if (event.target === editPropertyModal) {
            editPropertyModal.classList.remove('active');
        }
    };

    console.log('Smart Home Survey App Initialized with Central DB');
});