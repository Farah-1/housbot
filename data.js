// ===== DATA MANAGEMENT =====
// This file contains all the data structures and default data for the application

// Device Categories
const DEVICE_CATEGORIES = {
    switch: { name: 'Smart Switches', icon: '⚡' },
    sensor: { name: 'Sensors', icon: '📡' },
    camera: { name: 'Cameras', icon: '📹' },
    curtain: { name: 'Smart Curtains', icon: '🪟' },
    lock: { name: 'Smart Locks', icon: '🔐' },
    ir: { name: 'IR Controllers', icon: '📺' },
    plug: { name: 'Smart Plugs', icon: '🔌' }
};

// Room Types
const ROOM_TYPES = {
    apartment: ['Reception', 'Master Bedroom', 'Kids Bedroom', 'Kitchen', 'Bathroom', 'Balcony'],
    duplex: ['Reception', 'Kitchen', 'Bathroom', 'Master Bedroom', 'Kids Bedroom', 'Balcony'],
    villa: ['Reception', 'Kitchen', 'Office', 'Bathroom', 'Master Bedroom', 'Kids Bedroom', 'Balcony', 'Storage', 'Server Room'],
    office: ['Workspace', 'Manager Room', 'Meeting Room', 'Server Room'],
    shop: ['Main Area', 'Storage', 'Office', 'Bathroom']
};

// Default Devices Database
let devicesDatabase = [
    {
        id: 1,
        name: 'Zigbee Smart Switch',
        category: 'switch',
        brand: 'Philips Hue',
        protocol: 'Zigbee',
        price: 850,
        supplier: 'Local Distributor',
        active: true
    },
    {
        id: 2,
        name: 'Wi-Fi Smart Switch',
        category: 'switch',
        brand: 'TP-Link',
        protocol: 'Wi-Fi',
        price: 650,
        supplier: 'Local Distributor',
        active: true
    },
    {
        id: 3,
        name: 'Motion Sensor',
        category: 'sensor',
        brand: 'Aqara',
        protocol: 'Zigbee',
        price: 450,
        supplier: 'Local Distributor',
        active: true
    },
    {
        id: 4,
        name: 'Temperature Sensor',
        category: 'sensor',
        brand: 'Aqara',
        protocol: 'Zigbee',
        price: 500,
        supplier: 'Local Distributor',
        active: true
    },
    {
        id: 5,
        name: 'HD Smart Camera',
        category: 'camera',
        brand: 'Hikvision',
        protocol: 'Wi-Fi',
        price: 2500,
        supplier: 'Local Distributor',
        active: true
    },
    {
        id: 6,
        name: '4K Smart Camera',
        category: 'camera',
        brand: 'Hikvision',
        protocol: 'Wi-Fi',
        price: 3500,
        supplier: 'Local Distributor',
        active: true
    },
    {
        id: 7,
        name: 'Motorized Curtain',
        category: 'curtain',
        brand: 'Dooya',
        protocol: 'Zigbee',
        price: 1500,
        supplier: 'Local Distributor',
        active: true
    },
    {
        id: 8,
        name: 'Smart Lock',
        category: 'lock',
        brand: 'Yale',
        protocol: 'Zigbee',
        price: 2000,
        supplier: 'Local Distributor',
        active: true
    },
    {
        id: 9,
        name: 'IR Controller',
        category: 'ir',
        brand: 'Broadlink',
        protocol: 'Wi-Fi',
        price: 800,
        supplier: 'Local Distributor',
        active: true
    },
    {
        id: 10,
        name: 'Smart Plug',
        category: 'plug',
        brand: 'Sonoff',
        protocol: 'Wi-Fi',
        price: 300,
        supplier: 'Local Distributor',
        active: true
    }
];

// Properties Database
let propertiesDatabase = [
    {
        id: 1,
        clientName: 'Ahmed Hassan',
        clientPhone: '+20 100 123 4567',
        clientImage: 'https://i.pravatar.cc/150?img=1',
        propertyType: 'apartment',
        location: 'Downtown Cairo, Egypt',
        totalArea: 120,
        rooms: [
            {
                id: 1,
                name: 'Living Room',
                floor: 'Ground',
                type: 'Reception',
                devices: [
                    { deviceId: 1, quantity: 2 },
                    { deviceId: 3, quantity: 1 }
                ]
            },
            {
                id: 2,
                name: 'Master Bedroom',
                floor: 'First',
                type: 'Master Bedroom',
                devices: [
                    { deviceId: 1, quantity: 1 }
                ]
            },
            {
                id: 3,
                name: 'Kitchen',
                floor: 'Ground',
                type: 'Kitchen',
                devices: [
                    { deviceId: 1, quantity: 3 },
                    { deviceId: 4, quantity: 1 }
                ]
            },
            {
                id: 4,
                name: 'Bathroom',
                floor: 'Ground',
                type: 'Bathroom',
                devices: []
            }
        ]
    },
    {
        id: 2,
        clientName: 'Fatima Al-Mansouri',
        clientPhone: '+20 100 234 5678',
        clientImage: 'https://i.pravatar.cc/150?img=2',
        propertyType: 'villa',
        location: 'New Cairo, Egypt',
        totalArea: 350,
        rooms: [
            {
                id: 5,
                name: 'Living Room',
                floor: 'Ground',
                type: 'Reception',
                devices: [
                    { deviceId: 1, quantity: 3 },
                    { deviceId: 5, quantity: 2 }
                ]
            },
            {
                id: 6,
                name: 'Master Bedroom',
                floor: 'First',
                type: 'Master Bedroom',
                devices: [
                    { deviceId: 1, quantity: 2 },
                    { deviceId: 7, quantity: 1 }
                ]
            }
        ]
    },
    {
        id: 3,
        clientName: 'Tech Startup Inc.',
        clientPhone: '+20 100 345 6789',
        clientImage: 'https://i.pravatar.cc/150?img=3',
        propertyType: 'office',
        location: 'Smart City, Egypt',
        totalArea: 500,
        rooms: [
            {
                id: 7,
                name: 'Workspace',
                floor: 'First',
                type: 'Workspace',
                devices: [
                    { deviceId: 2, quantity: 5 },
                    { deviceId: 3, quantity: 3 }
                ]
            },
            {
                id: 8,
                name: 'Meeting Room',
                floor: 'First',
                type: 'Meeting Room',
                devices: [
                    { deviceId: 1, quantity: 2 },
                    { deviceId: 9, quantity: 1 }
                ]
            }
        ]
    }
];

// Current State
let currentPropertyId = null;
let currentRoomId = null;
let backgroundImageUrl = 'hausbot_background.jpg';
let editingDeviceId = null;

// ===== HELPER FUNCTIONS =====

function getDeviceById(deviceId) {
    return devicesDatabase.find(d => d.id === deviceId);
}

function getPropertyById(propertyId) {
    return propertiesDatabase.find(p => p.id === propertyId);
}

function getRoomById(roomId) {
    for (let property of propertiesDatabase) {
        const room = property.rooms.find(r => r.id === roomId);
        if (room) return room;
    }
    return null;
}

function calculateRoomTotal(room) {
    let total = 0;
    room.devices.forEach(roomDevice => {
        const device = getDeviceById(roomDevice.deviceId);
        if (device) {
            total += device.price * roomDevice.quantity;
        }
    });
    return total;
}

function calculatePropertyTotal(property) {
    let total = 0;
    property.rooms.forEach(room => {
        total += calculateRoomTotal(room);
    });
    return total;
}

function getNextDeviceId() {
    const maxId = Math.max(...devicesDatabase.map(d => d.id), 0);
    return maxId + 1;
}

function getNextPropertyId() {
    const maxId = Math.max(...propertiesDatabase.map(p => p.id), 0);
    return maxId + 1;
}

function getNextRoomId() {
    let maxId = 0;
    propertiesDatabase.forEach(p => {
        p.rooms.forEach(r => {
            if (r.id > maxId) maxId = r.id;
        });
    });
    return maxId + 1;
}

// ===== LOCAL STORAGE FUNCTIONS =====

function saveDataToLocalStorage() {
    localStorage.setItem('devicesDatabase', JSON.stringify(devicesDatabase));
    localStorage.setItem('propertiesDatabase', JSON.stringify(propertiesDatabase));
    localStorage.setItem('backgroundImageUrl', backgroundImageUrl);
}

function loadDataFromLocalStorage() {
    const savedDevices = localStorage.getItem('devicesDatabase');
    const savedProperties = localStorage.getItem('propertiesDatabase');
    const savedBackground = localStorage.getItem('backgroundImageUrl');

    if (savedDevices) devicesDatabase = JSON.parse(savedDevices);
    if (savedProperties) propertiesDatabase = JSON.parse(savedProperties);
    if (savedBackground) backgroundImageUrl = savedBackground;
}

// Load data on page load
loadDataFromLocalStorage();
