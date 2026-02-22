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

        const imageHtml = property.clientImage ? 
            `<img src="${property.clientImage}" alt="${property.clientName}" class="property-card-image">` : 
            '';

        card.innerHTML = `
            ${imageHtml}
            <div class="property-card-info-section" onclick="goToRooms('${property.firebaseId}')">
                <div class="property-card-header">
                    <div class="property-card-title">${property.clientName}</div>
                    <div class="property-card-type">${property.propertyType.charAt(0).toUpperCase() + property.propertyType.slice(1)}</div>
                </div>
                <div class="property-card-info">📍 ${property.location}</div>
                <div class="property-card-info">📐 ${property.totalArea} m²</div>
                ${property.clientPhone ? `<div class="property-card-phone">📱 ${property.clientPhone}</div>` : ''}
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
    document.getElementById('clientImage').value = '';
    document.getElementById('propertyType').value = '';
    document.getElementById('propertyLocation').value = '';
    document.getElementById('propertyArea').value = '';
}

function saveProperty() {
    const clientName = document.getElementById('clientName').value.trim();
    const clientPhone = document.getElementById('clientPhone').value.trim();
    const clientImageInput = document.getElementById('clientImage');
    const propertyType = document.getElementById('propertyType').value;
    const location = document.getElementById('propertyLocation').value.trim();
    const totalArea = parseFloat(document.getElementById('propertyArea').value) || 0;

    if (!clientName || !propertyType) {
        alert('Please fill in all required fields (Client Name and Property Type)');
        return;
    }

    // Handle image upload
    let clientImage = 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70);
    if (clientImageInput.files && clientImageInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            clientImage = e.target.result;
            createNewProperty(clientName, clientPhone, clientImage, propertyType, location, totalArea);
        };
        reader.readAsDataURL(clientImageInput.files[0]);
    } else {
        createNewProperty(clientName, clientPhone, clientImage, propertyType, location, totalArea);
    }
}

async function createNewProperty(clientName, clientPhone, clientImage, propertyType, location, totalArea) {
    const { collection, addDoc } = window.fbMethods;
    
    const newProperty = {
        clientName: clientName,
        clientPhone: clientPhone,
        clientImage: clientImage,
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

function generatePDF() {
    const property = getPropertyById(currentPropertyId);
    const totalCost = calculatePropertyTotal(property);

    let pdfContent = `
Smart Home Survey Invoice
========================

Client: ${property.clientName}
Phone: ${property.clientPhone}
Location: ${property.location}
Property Type: ${property.propertyType}
Total Area: ${property.totalArea} m²

---

DEVICES BREAKDOWN:

`;

    property.rooms.forEach(room => {
        pdfContent += `\n${room.name}:\n`;
        room.devices.forEach(roomDevice => {
            const device = getDeviceById(roomDevice.deviceId);
            if (device) {
                const lineTotal = device.price * roomDevice.quantity;
                pdfContent += `  - ${device.name} x${roomDevice.quantity} = ${lineTotal.toLocaleString()} EGP\n`;
            }
        });
    });

    pdfContent += `\n---\nTOTAL PROJECT COST: ${totalCost.toLocaleString()} EGP`;

    // Create a downloadable text file (in a real app, this would be a PDF)
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pdfContent));
    element.setAttribute('download', `invoice_${property.clientName.replace(/\s+/g, '_')}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    alert('Invoice generated and downloaded successfully!');
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