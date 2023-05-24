const express = require('express');
const server = express();
const multer = require("multer");
const fs = require('fs');
const mysql = require('mysql2');
const imagesFolder = __dirname + "\\public\\images\\";
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
require("dotenv").config();
const socketServer = require('http').Server(server);
const io = require('socket.io')(socketServer, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["*"],
        credentials: true
    }
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = imagesFolder;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {recursive: true});
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1024 * 1024 * 10 }
});

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME
});

db.connect();

db.query('CREATE TABLE IF NOT EXISTS UserImages (' +
    'ui_id INT PRIMARY KEY AUTO_INCREMENT,' +
    'ui_filepath VARCHAR(255) NOT NULL);', (err) => {
    if (err) throw err
})

db.query('CREATE TABLE IF NOT EXISTS Roles (' +
    'role_id INT PRIMARY KEY AUTO_INCREMENT,' +
    'role_name VARCHAR(255) NOT NULL);', (err) => {
    if (err) throw err
})

db.query('CREATE TABLE IF NOT EXISTS Users (' +
    'u_id INT PRIMARY KEY AUTO_INCREMENT,' +
    'u_nickname VARCHAR(100) UNIQUE NOT NULL,' +
    'u_surname VARCHAR(100) NOT NULL,' +
    'u_name VARCHAR(100) NOT NULL,' +
    'u_patronymic VARCHAR(100),' +
    'u_role_id INT NOT NULL,' +
    'u_email VARCHAR(255) UNIQUE NOT NULL,' +
    'u_password VARCHAR(255) NOT NULL,' +
    'u_sex ENUM("Male","Female","Sok") NOT NULL,' +
    'u_profile_image_id INT DEFAULT 1,' +
    'FOREIGN KEY (u_profile_image_id) references UserImages(ui_id) On Update Cascade ON DELETE Restrict,' +
    'FOREIGN KEY (u_role_id) references Roles(role_id) On Update Cascade ON DELETE Restrict);', (err) => {
    if (err) throw err
})

db.query('CREATE TABLE IF NOT EXISTS Restaurants (' +
    'r_id INT PRIMARY KEY AUTO_INCREMENT,' +
    'r_name VARCHAR(100) UNIQUE NOT NULL,' +
    'r_price VARCHAR(4) NOT NULL,' +
    'r_address VARCHAR(255) NOT NULL,' +
    'r_bookingAllowed BOOLEAN NOT NULL,' +
    'r_openTime TIME NOT NULL,' +
    'r_closeTime TIME NOT NULL,' +
    'r_description TEXT,' +
    'r_owner_id INT NOT NULL,' +
    'FOREIGN KEY (r_owner_id) references Users(u_id) ON DELETE CASCADE);', (err) => {
    if (err) throw err
})

db.query('CREATE TABLE IF NOT EXISTS RestaurantImages (' +
    'ri_id INT PRIMARY KEY AUTO_INCREMENT,' +
    'ri_restaurant_id INT NOT NULL,' +
    'ri_filepath VARCHAR(255) NOT NULL,' +
    'ri_is_main boolean NOT NULL,' +
    'FOREIGN KEY (ri_restaurant_id) references Restaurants(r_id) ON DELETE CASCADE);', (err) => {
    if (err) throw err
})

db.query('CREATE TABLE IF NOT EXISTS RestaurantRooms (' +
    'room_id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'room_r_id INT NOT NULL,' +
    'room_name VARCHAR(30) NOT NULL,' +
    'room_capacity INT NOT NULL, ' +
    'room_width INT NOT NULL,' +
    'room_height INT NOT NULL,' +
    'FOREIGN KEY (room_r_id) references Restaurants(r_id) ON DELETE CASCADE);', (err) => {
    if (err) throw err
})

db.query('CREATE TABLE IF NOT EXISTS Tables (' +
    'table_id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'table_room_id BIGINT NOT NULL,' +
    'table_capacity INT NOT NULL,' +
    'table_radius INT NOT NULL CHECK (table_radius > 0 AND table_radius < 150),' +
    'table_x DECIMAL(4,2) NOT NULL CHECK (table_x > 0),' +
    'table_y DECIMAL(4,2) NOT NULL CHECK (table_y > 0),' +
    'FOREIGN KEY (table_room_id) references RestaurantRooms(room_id) ON DELETE CASCADE);', (err) => {
    if (err) throw err
})

db.query('CREATE TABLE IF NOT EXISTS TableBookings (' +
    'tb_id BIGINT PRIMARY KEY AUTO_INCREMENT,' +
    'tb_user_id INT NOT NULL,' +
    'tb_arriveDate DATE NOT NULL,' +
    'tb_arriveTime TIME NOT NULL,' +
    'tb_leaveTime TIME NOT NULL,' +
    'FOREIGN KEY (tb_user_id) references Users(u_id) ON DELETE CASCADE);', (err) => {
    if (err) throw err
})

db.query('CREATE TABLE IF NOT EXISTS M2M_Tables_TableBookings (' +
    'tb_id BIGINT NOT NULL,' +
    'table_id BIGINT NOT NULL,' +
    'PRIMARY KEY (`tb_id`, `table_id`),'+
    'FOREIGN KEY (tb_id) references TableBookings(tb_id) ON DELETE CASCADE,' +
    'FOREIGN KEY (table_id) references Tables(table_id) ON DELETE CASCADE);', (err) => {
    if (err) throw err
})


function allowCrossDomain(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.header('Access-Control-Allow-Credentials', 'true');
    next();
}

const verifyUserToken = (req, res, next) => {
    if (req.cookies == undefined || req.cookies.JWT == undefined) {
        return res.status(401).send("Unauthorized request");
    }
    const token = req.cookies.JWT;
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(400).send("Invalid token.");
    }
};

server.use(allowCrossDomain);
server.use(cookieParser());
server.use(express.static(__dirname + "/public"));
server.use(express.urlencoded(false));

server.get('/getAllRestaurants', verifyUserToken, async function (req, res) {
    const name = req.query.name;
    const price = req.query.price;
    const capacityFrom = req.query.capacityFrom;
    const capacityTo = req.query.capacityTo;
    let restaurants = await getAllRestaurants();
    if(name!==undefined && name!=="") restaurants = restaurants.filter(rest => rest.r_name.toUpperCase().includes(name.toUpperCase()));
    if(price!==undefined && price!=="") restaurants = restaurants.filter(rest => rest.r_price===price);
    if(capacityFrom!==undefined && capacityFrom!=="") restaurants = restaurants.filter(rest => rest.r_capacity >= capacityFrom);
    if(capacityTo!==undefined && capacityTo!=="") restaurants = restaurants.filter(rest => rest.r_capacity <= capacityTo);
    res.status(200).send({
        restaurants : restaurants
    });
})

server.get('/getUserInfo', verifyUserToken, async function (req, res) {
    const user = req.user;
    user.u_password = null;
    res.status(200).send({
        user: user
    });
})

server.get('/getUserProfilePictureById', verifyUserToken, async function (req, res) {
    const id = req.query.id;
    const picture = await getProfilePictureByUserId(id)
    res.status(200).send({
        profileImagePath : picture.ui_filepath
    });
})

server.get('/getAllReservationsByUserId', verifyUserToken, async function (req, res) {
    const id = req.query.id;
    const reservations = await getAllReservationsByUserId(id)
    reservations.forEach(reservation => {
        addStatusToReservation(reservation);
    });
    res.status(200).send({
        reservations : reservations
    });
})

server.post("/registration", upload.single('image'), async (req, res) => {
    let {nickname, surname, name, patronymic, email, password, sex, role} = req.body;
    const image = req.file;
    const nicknameResult = await getAllUsers({"u_nickname":nickname});
    const emailResult = await getAllUsers({"u_email":email});
    let correct = true;
    let errors = {};
    if(nicknameResult.length>0) {
        correct = false;
        errors.nicknameError = 'Никнейм уже занят!';
    }
    if(emailResult.length>0) {
        correct = false;
        errors.emailError = 'Почтовый ящик уже занят!';
    }
    if (req.cookies !== undefined && req.cookies.JWT !== undefined) {
        correct = false;
        errors.alreadyAuthorizedError = 'Вы уже авторизованы!';
    }
    if(!correct) {
        if(image!==undefined) fs.rmSync(imagesFolder+image.filename);
        res.status(400).send({ errors: errors });
    }
    else {
        let imageId = 1;
        let fields, values;
        if(image!==undefined) {
            values = [
                image.filename
            ];
            fields = ['ui_filepath'];
            let result = await addUserImage(values,fields);
            imageId = result.insertId;
        }
        const hash = await bcrypt.hash(password, 10);
        fields = ['u_nickname,u_surname,u_name,u_patronymic,u_email,u_password,u_sex,u_role_id,u_profile_image_id'];
        values = [
            nickname,surname,name,patronymic,email,hash,sex,role,imageId
        ];
        await addUser(values, fields);
        const user = await getUserByEmail(email);
        const token = await jwt.sign({ user }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        await res.cookie("JWT",token, { maxAge: 3600000, httpOnly: true, path: "/", secure: false}).status(200).send({user:user});
    }
});

server.post("/login", upload.none(), async (req, res) => {
    let {email, password} = req.body;
    const user = await getUserByEmail(email);
    let correct = true;
    let errors = {};
    if(!user || !bcrypt.compareSync(password, user.u_password)) {
        correct = false;
        errors.noCorrectDataError= 'Неверный логин или пароль!';
    }
    if (req.cookies !== undefined && req.cookies.JWT !== undefined) {
        correct = false;
        errors.alreadyAuthorizedError = 'Вы уже авторизованы!';
    }
    if(!correct) {
        res.status(400).send({ errors: errors });
    }
    else {
        const token = await jwt.sign({ user }, process.env.JWT_SECRET, {
            expiresIn: "1h",
        });
        await res.cookie("JWT",token, { maxAge: 3600000, httpOnly: true, path: "/", secure: false}).status(200).send({user:user});
    }
});

server.post("/logout", verifyUserToken, async (req, res) => {
    await res.clearCookie("JWT").status(200).send();
});

server.get('/getRestaurantById', verifyUserToken, async function (req, res) {
    const id = req.query.id;
    const restaurant = await getRestaurantById(id)
    const capacity = await getRestaurantCapacity(id)
    if(restaurant) {
        restaurant.r_capacity = capacity.sum;
        res.status(200).send({
            restaurant : restaurant
        });
    }
    else {
        res.status(404).send();
    }
})

server.get('/getRoomsByRestaurantId', verifyUserToken, async function (req, res) {
    const id = req.query.id;
    const rooms = await getRoomsByRestaurantId(id);
    res.status(200).send({
        rooms : rooms
    });
})

server.get('/getTablesByRoomId', verifyUserToken, async function (req, res) {
    const id = req.query.id;
    const tables = await getTablesByRoomId(id);
    res.status(200).send({
        tables : tables
    });
})

server.post('/getBusyTables', verifyUserToken, upload.none(), async function (req, res) {
    let {date, arriveTime, leaveTime, roomId} = req.body;
    const tables = await getAllTablesThatAreBusyBetweenThatTimestamps(date, arriveTime, leaveTime, roomId);
    let newTables = [];
    for (let table of tables) {
        newTables.push(table.table_id)
    }
    res.status(200).send({
        tables : newTables
    });
})

server.post('/createReservation', verifyUserToken, upload.none(), async function (req, res) {
    let {date, arriveTime, leaveTime, selectedTables, room_id} = req.body;
    const user = req.user;
    let fields = ['tb_arriveDate,tb_arriveTime,tb_leaveTime,tb_user_id'];
    let values = [
        date,arriveTime,leaveTime,user.u_id
    ];
    let correct = true;
    let errors = {};

    const [hours, minutes] = arriveTime.split(':');
    const bookingDate = new Date(date);
    bookingDate.setHours(hours);
    bookingDate.setMinutes(minutes);
    const busyTableIds = await getAllTablesThatAreBusyBetweenThatTimestamps(date, arriveTime, leaveTime, room_id);
    const isAnyTableBusy = selectedTables.some(table => busyTableIds.includes(table.table_id));
    if(isAnyTableBusy) {
        correct = false;
        errors.busyTableError = 'Некоторые из выбранных столов уже заняты!';
    }
    if(bookingDate < new Date()) {
        correct = false;
        errors.dateError = 'Выбранная дата уже прошла. Бронь недоступна!';
    }
    if(!correct) {
        res.status(400).send({ errors: errors });
    }
    else {
        const result = await addTableBooking(values, fields);
        fields = ['tb_id,table_id'];
        for (let table of selectedTables) {
            values = [
                result.insertId, table
            ];
            await addTableToTableBooking(values, fields);
        }
        res.status(200).send({id: result.insertId});
    }
})

server.post('/addRoom', verifyUserToken, upload.none(), async function (req, res) {
    let {room_name, room_width, room_height, room_capacity, room_r_id} = req.body;
    let values = [
        room_name, room_r_id, room_capacity, room_width, room_height
    ];
    let fields = ['room_name,room_r_id,room_capacity, room_width, room_height'];
    let result = await addRestaurantRoom(values, fields);
    res.status(200).send({id: result.insertId});
})

server.put('/changeRoom', verifyUserToken, upload.none(), async function (req, res) {
    let {room_name, room_width, room_height, room_capacity, room_r_id, room_id} = req.body;
    let values = [
        room_name, room_r_id, room_capacity, room_width, room_height, room_id
    ];
    let fields = ['room_name','room_r_id','room_capacity', 'room_width', 'room_height'];
    await changeRestaurantRoom(values, fields);
    res.status(200).send("Информация о помещении изменена!");
})

server.delete('/delete-room', verifyUserToken, async (req, res) => {
    const room_id = req.query.id;
    await deleteRoom(room_id);
    await res.status(200).send('Помещение удалено!');
})

server.post('/addTable', verifyUserToken, upload.none(), async function (req, res) {
    let {table_radius, table_x, table_y, table_capacity, table_room_id} = req.body;
    let values = [
        table_radius, table_x, table_y, table_capacity, table_room_id
    ];
    let fields = ['table_radius, table_x, table_y, table_capacity, table_room_id'];
    let result = await addTable(values, fields);
    res.status(200).send({id: result.insertId});
})

server.put('/changeTable', verifyUserToken, upload.none(), async function (req, res) {
    let {table_radius, table_x, table_y, table_capacity, table_room_id, table_id} = req.body;
    let values = [
        table_radius, table_x, table_y, table_capacity, table_room_id, table_id
    ];
    let fields = ['table_radius','table_x','table_y', 'table_capacity', 'table_room_id'];
    await changeTable(values, fields);
    res.status(200).send("Информация о столе изменена!");
})

server.delete('/delete-table', verifyUserToken, async (req, res) => {
    const table_id = req.query.id;
    await deleteTable(table_id);
    await res.status(200).send('Стол удален!');
})

server.get('/getMainImages', verifyUserToken, async function (req, res) {
    const images = await getMainRestaurantImages();
    res.status(200).send({
        images : images
    });
})

server.get('/getImages', verifyUserToken, async function (req, res) {
    const id = req.query.id;
    const images = await getRestaurantImages(id);

    res.status(200).send({
        images : images
    });
})

server.post('/add-rest', verifyUserToken, upload.single('image'), async (req, res) => {
    const user = req.user;
    const { name, address, capacity, price, description, openTime, closeTime, bookingAllowed} = req.body;
    const image = req.file;
    if(user.role_name!=='admin' && user.role_name!=='owner')
        return res.status(403).send('Вы не можете добавлять рестораны!');
    const nameResult = await getAllRestaurants({"r_name":name});
    let correct = true;
    let errors = {};
    if(nameResult.length>0) {
        correct = false;
        errors.nameExistsError = 'Имя ресторана уже занято!';
    }
    if(!correct) {
        if(image!==undefined) fs.rmSync(imagesFolder+image.filename);
        res.status(400).send({ errors: errors });
    }
    else {
        let values = [
            name, address, price, description, req.user.u_id, openTime, closeTime, bookingAllowed==="on"
        ];
        let fields = ['r_name,r_address,r_price,r_description, r_owner_id, r_openTime, r_closeTime, r_bookingAllowed'];
        let result = await addRestaurant(values,fields);
        fields = ['ri_restaurant_id,ri_filepath,ri_is_main'];
        values = [
            result.insertId, image.filename, true
        ];
        await addRestaurantImage(values, fields);
        values = [
            "Главный зал", result.insertId, capacity, 700, 700
        ];
        fields = ['room_name,room_r_id,room_capacity, room_width, room_height'];
        await addRestaurantRoom(values, fields);
        io.emit("updateRestaurants");
        let id = result.insertId;
        res.status(200).send({id:id});
    }
})

server.put('/change-rest', verifyUserToken, upload.single('image'), async (req, res) => {
    const id = req.query.id;
    const user = req.user;
    const { name, address, price, description, openTime, closeTime, bookingAllowed} = req.body;
    const image = req.file;
    const oldInfo = await getRestaurantById(id);
    if(user.role_name!=='admin' && oldInfo.r_owner_id!==user.u_id) {
        return res.status(403).send('Недостаточно прав!');
    }
    const nameResult = await getAllRestaurants({"r_name":name});
    let correct = true;
    let errors = {};
    if(nameResult.length>0 && oldInfo.r_name!==nameResult[0].r_name) {
        correct = false;
        errors.nameExistsError = 'Имя ресторана уже занято!';
    }
    if(!correct) {
        if(image!==undefined) fs.rmSync(imagesFolder+image.filename);
        res.status(400).send({ errors: errors });
    }
    else {
        if(image!==undefined) {
            let oldImage = (await getRestaurantImages(id))[0];
            await fs.rm(imagesFolder+oldImage.ri_filepath,()=>{

            });
            await changeRestaurantImage(oldImage.ri_filepath, image.filename)
        }
        let values =
            [name, address, price, description, openTime, closeTime, bookingAllowed==="on", id];
        let fields = ['r_name','r_address','r_price','r_description', 'r_openTime', 'r_closeTime', 'r_bookingAllowed'];
        await updateRestaurant(values,fields);
        io.emit("updateRestaurants");
        await res.status(200).send('Информация о ресторане изменена!');
    }
})

server.delete('/delete-rest', verifyUserToken, async (req, res) => {
    const r_id = req.query.id;
    const user = req.user;
    const oldInfo = await getRestaurantById(r_id);
    if(user.role_name!=='admin' && oldInfo.r_owner_id!==user.u_id)
        return res.status(403).send('Недостаточно прав!');
    if(oldInfo==undefined) {
        return res.status(404).send("Ресторан с id "+r_id+" не существует!");
    }
    else {
        let images = await getRestaurantImages(r_id);
        for (let i = 0; i < images.length; i++) {
            try {
                fs.rmSync(imagesFolder + images[i].ri_filepath);
            }catch (reason) {

            }
        }
        await deleteRestaurant(r_id);
        io.emit("updateRestaurants");
        await res.status(200).send('Ресторан удалён!');
    }
})

server.delete('/delete-booking', verifyUserToken, async (req, res) => {
    const tb_id = req.query.id;
    const user = req.user;
    const oldInfo = await getBookingById(tb_id);
    addStatusToReservation(oldInfo);
    if(user.role_name!=='admin' && oldInfo.tb_user_id!==user.u_id)
        return res.status(403).send('Недостаточно прав!');
    if(oldInfo==undefined) {
        return res.status(404).send("Бронирование с id "+tb_id+" не существует!");
    }
    if(oldInfo.tb_status!=="future") {
        return res.status(400).send('Бронирование уже завершено!');
    }
    else {
        await deleteBooking(tb_id);
        await res.status(200).send('Бронирование удалено!');
    }
})

server.delete('/delete-room', verifyUserToken, async (req, res) => {
    const room_id = req.query.id;
    await deleteRoom(room_id);
    await res.status(200).send('Бронирование удалено!');
})

//my lovely functions <3

function addStatusToReservation(reservation) {
    const arriveDateTime = new Date(reservation.tb_arriveDate);
    let [hours, minutes] = reservation.tb_arriveTime.split(':');
    arriveDateTime.setHours(hours);
    arriveDateTime.setMinutes(minutes);

    let leaveDateTime = new Date(reservation.tb_arriveDate);
    [hours, minutes] = reservation.tb_leaveTime.split(':');
    leaveDateTime.setHours(hours);
    leaveDateTime.setMinutes(minutes);

    if (leaveDateTime < arriveDateTime) {
        const oneDay = 24 * 60 * 60 * 1000; // one day in milliseconds
        leaveDateTime = new Date(leaveDateTime.getTime() + oneDay);
    }
    const currentDateTime = new Date();
    console.log(arriveDateTime+" "+leaveDateTime+" "+currentDateTime)
    if (currentDateTime < arriveDateTime) {
        reservation.tb_status = 'future';
    } else if (currentDateTime >= arriveDateTime && currentDateTime <= leaveDateTime) {
        reservation.tb_status = 'in progress';
    } else {
        reservation.tb_status = 'past';
    }
}

function getAllRestaurants (filter) {
    let sqlQuery = 'SELECT Restaurants.*, SUM(RestaurantRooms.room_capacity) AS r_capacity FROM Restaurants Join RestaurantRooms On Restaurants.r_id=RestaurantRooms.room_r_id';
    let a = 0;
    let values = [];
    for (let filterKey in filter) {
        if(filter[filterKey]!=undefined && filter[filterKey]!=="") {
            if(a===0) {
                sqlQuery += ' WHERE ';
                a++;
            }
            else {
                sqlQuery += ' AND ';
            }
            sqlQuery += filterKey + ' = ? '
            values += filter[filterKey];
        }
    }
    sqlQuery += " Group by r_id";
    return new Promise(function (resolve, reject) {
        db.query(sqlQuery, values, (err, rests) => {
            if (err) reject(err)
            resolve(rests);
        })
    });
}

function getRestaurantById (id) {
    let sqlQuery = 'SELECT * FROM Restaurants WHERE r_id = ?';
    return new Promise(function (resolve, reject) {
        db.query(sqlQuery, [id], (err, rests) => {
            if (err) reject(err)
            resolve(rests[0]);
        })
    });
}

function getBookingById (id) {
    let sqlQuery = 'SELECT * FROM TableBookings WHERE tb_id = ?';
    return new Promise(function (resolve, reject) {
        db.query(sqlQuery, [id], (err, bookings) => {
            if (err) reject(err)
            resolve(bookings[0]);
        })
    });
}

function getRoomsByRestaurantId (id) {
    let sqlQuery = 'SELECT * FROM RestaurantRooms WHERE room_r_id = ?';
    return new Promise(function (resolve, reject) {
        db.query(sqlQuery, [id], (err, rooms) => {
            if (err) reject(err)
            resolve(rooms);
        })
    });
}

function getProfilePictureByUserId (id) {
    let sqlQuery = 'SELECT * FROM UserImages WHERE ui_id = ?';
    return new Promise(function (resolve, reject) {
        db.query(sqlQuery, [id], (err, pictures) => {
            if (err) reject(err)
            resolve(pictures[0]);
        })
    });
}

function getTablesByRoomId (id) {
    let sqlQuery = 'SELECT * FROM Tables WHERE table_room_id = ?';
    return new Promise(function (resolve, reject) {
        db.query(sqlQuery, [id], (err, tables) => {
            if (err) reject(err)
            resolve(tables);
        })
    });
}

function getAllTablesThatAreBusyBetweenThatTimestamps (date, arriveTime, leaveTime, room_id) {
    let sqlQuery = 'SELECT t.table_id FROM Tables t' +
        ' INNER JOIN M2M_Tables_TableBookings m2m ON t.table_id = m2m.table_id' +
        ' INNER JOIN TableBookings tb ON m2m.tb_id = tb.tb_id' +
        ' WHERE tb.tb_arriveDate = ? AND tb.tb_arriveTime < ? AND tb.tb_leaveTime > ? AND t.table_room_id = ?;';
    return new Promise(function (resolve, reject) {
        db.query(sqlQuery, [date, leaveTime, arriveTime, room_id], (err, tables) => {
            if (err) reject(err)
            resolve(tables);
        })
    });
}

function getAllReservationsByUserId (id) {
    let sqlQuery = 'SELECT' +
        ' Restaurants.r_name,' +
        ' Restaurants.r_address,' +
        ' TableBookings.tb_arriveDate,' +
        ' TableBookings.tb_arriveTime,' +
        ' TableBookings.tb_leaveTime,' +
        ' TableBookings.tb_id,' +
        ' COUNT(M2M_Tables_TableBookings.table_id) AS table_count' +
        ' FROM' +
        ' TableBookings' +
        ' JOIN M2M_Tables_TableBookings ON TableBookings.tb_id = M2M_Tables_TableBookings.tb_id' +
        ' JOIN Tables ON M2M_Tables_TableBookings.table_id = Tables.table_id' +
        ' JOIN RestaurantRooms ON Tables.table_room_id = RestaurantRooms.room_id' +
        ' JOIN Restaurants ON RestaurantRooms.room_r_id = Restaurants.r_id' +
        ' WHERE' +
        ' TableBookings.tb_user_id = ?' +
        ' GROUP BY' +
        ' TableBookings.tb_id;';
    return new Promise(function (resolve, reject) {
        db.query(sqlQuery, [id], (err, reservations) => {
            if (err) reject(err)
            resolve(reservations);
        })
    });
}

function getMainRestaurantImages () {
    return new Promise(function (resolve, reject) {
        db.query('SELECT * FROM RestaurantImages WHERE ri_is_main=true', (err, imagesDB) => {
            let images = {};
            try {
                for(let i = 0; i<imagesDB.length; i++) {
                    images[imagesDB[i].ri_restaurant_id] = imagesDB[i].ri_filepath;
                }
            }
            catch (e) {}
            if (err) reject(err)
            resolve(images)
        })
    });
}

function getRestaurantImages (id) {
    return new Promise(function (resolve, reject) {
        db.query('SELECT * FROM RestaurantImages WHERE ri_restaurant_id = ? ORDER BY ri_is_main DESC', [id],(err, images) => {
            if (err) reject(err)
            resolve(images)
        })
    });
}

function addRestaurant (values, fields) {
    return new Promise(function (resolve, reject) {
        db.query('insert into Restaurants ('+fields+') VALUES (?)', [values], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function updateRestaurant (values, fields) {
    let query = 'update Restaurants set ';
    for (let i = 0; i < fields.length-1; i++) {
        query += (fields[i] + " = ?, ");
    }
    query += (fields[fields.length-1] + " = ? where r_id = ?");
    return new Promise(function (resolve, reject) {
        db.query(query, values, (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function addTableBooking (values, fields) {
    return new Promise(function (resolve, reject) {
        db.query('insert into TableBookings ('+fields+') VALUES (?)', [values], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function addTableToTableBooking (values, fields) {
    return new Promise(function (resolve, reject) {
        db.query('insert into M2M_Tables_TableBookings ('+fields+') VALUES (?)', [values], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function addUser (values, fields) {
    return new Promise(function (resolve, reject) {
        db.query('insert into Users ('+fields+') VALUES (?)', [values], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function getAllUsers (filter) {
    let sqlQuery = 'SELECT * FROM Users';
    let a = 0;
    let values = [];
    for (let filterKey in filter) {
        if(filter[filterKey]!=undefined && filter[filterKey]!=="") {
            if(a==0) {
                sqlQuery += ' WHERE ';
                a++;
            }
            else {
                sqlQuery += ' AND ';
            }
            sqlQuery += filterKey + ' = ? '
            values += filter[filterKey];
        }
    }
    return new Promise(function (resolve, reject) {
        db.query(sqlQuery, values, (err, rests) => {
            if (err) reject(err)
            resolve(rests);
        })
    });
}

function getUserByEmail(email) {
    let sqlQuery = 'select Users.*,Roles.role_name from Users JOIN Roles On Roles.role_id=Users.u_role_id where u_email=?';
    return new Promise(function (resolve, reject) {
        db.query(sqlQuery, [email], (err, rests) => {
            if (err) reject(err)
            resolve(rests[0]);
        })
    });
}

function addRestaurantImage (values, fields) {
    return new Promise(function (resolve, reject) {
        db.query('insert into RestaurantImages ('+fields+') VALUES (?)', [values], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function addUserImage (values, fields) {
    return new Promise(function (resolve, reject) {
        db.query('insert into UserImages ('+fields+') VALUES (?)', [values], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}


function addRestaurantRoom (values, fields) {
    return new Promise(function (resolve, reject) {
        db.query('insert into RestaurantRooms ('+fields+') VALUES (?)', [values], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function addTable (values, fields) {
    return new Promise(function (resolve, reject) {
        db.query('insert into Tables ('+fields+') VALUES (?)', [values], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function getRestaurantCapacity (id) {
    return new Promise(function (resolve, reject) {
        db.query('select SUM(room_capacity) AS sum from RestaurantRooms where room_r_id = ?', [id], (err, result) => {
            if (err) reject(err)
            resolve(result[0])
        })
    });
}

function changeRestaurantImage(old_filename, new_filename) {
    return new Promise(function (resolve, reject) {
        db.query('UPDATE RestaurantImages SET ri_filepath = ? where ri_filepath = ?', [new_filename, old_filename], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function changeRestaurantRoom (values, fields) {
    let query = 'update RestaurantRooms set ';
    for (let i = 0; i < fields.length-1; i++) {
        query += (fields[i] + " = ?, ");
    }
    query += (fields[fields.length-1] + " = ? where room_id = ?");
    console.log(query)
    return new Promise(function (resolve, reject) {
        db.query(query, values, (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function changeTable (values, fields) {
    let query = 'update Tables set ';
    for (let i = 0; i < fields.length-1; i++) {
        query += (fields[i] + " = ?, ");
    }
    query += (fields[fields.length-1] + " = ? where table_id = ?");
    console.log(query)
    return new Promise(function (resolve, reject) {
        db.query(query, values, (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}


function deleteRestaurant (id) {
    return new Promise(function (resolve, reject) {
        db.query('delete from Restaurants where r_id = ?', [id], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function deleteBooking (id) {
    return new Promise(function (resolve, reject) {
        db.query('delete from TableBookings where tb_id = ?', [id], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function deleteRoom (id) {
    return new Promise(function (resolve, reject) {
        db.query('delete from RestaurantRooms where room_id = ?', [id], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

function deleteTable (id) {
    return new Promise(function (resolve, reject) {
        db.query('delete from Tables where table_id = ?', [id], (err, result) => {
            if (err) reject(err)
            resolve(result)
        })
    });
}

socketServer.listen(9090, () => {
    console.log('Server started on port 9090');
});

io.on('connection', (socket) => {
});

server.listen(8080)
