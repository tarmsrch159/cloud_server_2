const express = require("express");
const app = express();
const cors = require("cors");
const mysql = require("mysql");
const bodyParser = require("body-parser");
var fs = require("fs-extra");
const PORT = process.env.PORT || 4050;

//Library's about hashing password
const bcrypt = require("bcrypt");
const saltRounds = 13;
var jwt = require("jsonwebtoken");
const secret = "Mysecret_159";

const crypto = require("crypto");
const { error } = require("console");

const multer = require("multer");
const path = require("path");

const { notiEvent } = require("./Functions/Notify");
const token_Line = "RAl3CtmN2KGt6eu5g7ZvTdtpA2J1VygIzcnyhiP7VXt";

//Variable for conection to database
const db = mysql.createPool({
  host: "bqmn5uzoqbl28n6wo1ug-mysql.services.clever-cloud.com",
  user: "ui43my666qg92sci",
  password: "rlDPwE0lRpJ2c9P3e2aI",
  database: "bqmn5uzoqbl28n6wo1ug",
});

// const db = mysql.createPool({
//   host: "localhost",
//   user: "root",
//   password: "",
//   database: "mockup-could",
// });

// asdasd
app.use(bodyParser.json());

// asdasd
function keepAlive() {
  db.getConnection(function (err, connection) {
    if (err) {
      console.error("mysql keepAlive err", err);
      return;
    }
    console.log("ping db");
    connection.ping(); // this is what you want
    connection.release();
  });
}

setInterval(keepAlive, 60000);

// reconnect
// function connectWithRetry() {
//   const connection = db.connect(); // Replace with your connection logic
//   try{
//     connection.on('connect', () => {
//       console.log('Connected to the server.');
//       // You can now use the connection for your application
//     });

//     connection.on('close', () => {
//       console.log('Connection closed. Reconnecting...');
//       setTimeout(() => {
//         connectWithRetry();
//       }, 1000); // Retry after 1 second (adjust the delay as needed)
//     });
//   }catch (err){

//allow access for another domain

const directory_path = "public/";

fs.chmod(directory_path, 0o777, (err) => {
  if (err) {
    console.error(`เกิดข้อผิดพลาดในการตั้งค่าสิทธิ์: ${err}`);
  } else {
    console.log(`ตั้งค่าสิทธิ์เป็น 777 สำหรับ ${directoryPath}`);
  }
});

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Origin",
    // "https://frontend-user-test-deploy-tanachais-projects.vercel.app/"
    "*"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, GET, PUT, PATCH, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Option, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", true);
  return next();
});

app.use(express.json());
app.use(cors());
app.use(express.static("public"));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/");
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

app.post("/uploadfile", upload.array("image", 5), (req, res) => {
  if (req.files) {
    console.log(req.files);
  }
});

app.get("/show_all_data", (req, res) => {
  const query = "SELECT * FROM member";
  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      res.send(results);
    }
  });
});

//upload_payment
app.put("/payment/:id", upload.single("image"), (req, res) => {
  const id = req.params.id;
  const img = req.file.filename;

  const query = "UPDATE member SET receipt = ? WHERE reg_id = ?";

  db.query(query, [img, id], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      res.json({ status: "true" });
    }
  });
});

//Login user
app.post("/login_user", (req, res) => {
  const reg_id = req.body.reg_id;
  const id_card = req.body.id_card;

  var query = `SELECT reg_id, id_card, line_id,course_name.name_th AS course_name_th, candidate, address, prefix, name, lastname, nationality, tel, email, educational, branch, permission, receipt, gender, profile_img, kn_score, profi_score, sum_score, pass_fail, book_id,
  CONCAT( DATE_FORMAT( birthday , '%Y' ), '/', DATE_FORMAT( birthday , '%m' ) , '/', DATE_FORMAT( birthday , '%d' ) ) AS Thaibirthday, provinces.name_th AS province_name, amphures.name_th AS amphure_name, districts.name_th AS district_name
  FROM member
  INNER JOIN course_name
  ON member.course=course_name.id
  INNER JOIN provinces 
  ON member.province=provinces.id
  INNER JOIN amphures
  on member.amphure=amphures.id
  INNER JOIN districts
  on member.district=districts.id
  WHERE reg_id = ?`;

  db.query(query, [reg_id], (err, result) => {
    if (result.length > 0) {
      bcrypt.compare(id_card, result[0].id_card, function (err, auth) {
        if (auth) {
          const token = jwt.sign(
            { id_card: result[0].id_card, reg_id: result[0].reg_id },
            secret,
            {
              expiresIn: "1h",
            }
          );
          res.json({
            status: "true",
            message: "id card has authorized already",
            token,
            reg_id: reg_id,
            id_card: id_card,
            result: result,
          });
          const text = ` กรุณาใช้ เลขประจำตัวการสอบ: ${reg_id} '' เลขบัตรประจำตัวประชาชน: ของท่าน `;
          notiEvent(token_Line, text);
        } else {
          res.json({ status: "false", err });
        }
      });
    } else {
      res.json({ status: "false", err });
    }
  });
});

var cpUpload = upload.fields([
  { name: "image", maxCount: 5 },
  { name: "id_card_img", maxCount: 5 },
  { name: "educational_img", maxCount: 5 },
]);

app.post("/add_member", cpUpload, async (req, res) => {
  // // console.log(req.files['profile_img'])
  // console.log(req.files["id_card_img"][0].filename);
  // // console.log(req.files["educational_img"][0].filename);
  // const file = await fs.readFile(process.cwd() + 'public', 'utf8')
  // console.log(file)
  const reg_day = req.body.reg_day;
  const id_card = req.body.id_card;
  // const reg_id = req.body.reg_id;
  const name = req.body.name;
  const lastname = req.body.lastname;
  const name_EN = req.body.name_EN;
  const lastname_EN = req.body.lastname_EN;
  const gender = req.body.gender;
  const permission = req.body.permission;
  const receipt = req.body.receipt;
  const course = req.body.course;
  const candidate = req.body.candidate;
  const prefix = req.body.prefix;
  const prefixEN = req.body.prefixEN;
  const nationality = req.body.nationality;
  const birthday = req.body.birthday;
  const tel = req.body.tel;
  const email = req.body.email;
  const address = req.body.nationality;
  const educational = req.body.educational;
  const branch = req.body.branch;
  const province = req.body.province;
  const amphure = req.body.amphure;
  const district = req.body.district;
  const line_id = req.body.line_id;
  const img =
    req.files["image"][0].filename != undefined
      ? req.files["image"][0].filename
      : "";
  const id_card_img =
    req.files["id_card_img"][0].filename != undefined
      ? req.files["id_card_img"][0].filename
      : "";
  const educational_img =
    req.files["educational_img"][0].filename != undefined
      ? req.files["educational_img"][0].filename
      : "";
  const pass_fail = "";
  const book_id = "";
  const { kn_score, profi_score, sum_score } = req.body;
  const count_max_sql = `SELECT MAX(id) +1 AS id  FROM member;`;

  const destinationDirectory = "public/";

  const query = `INSERT INTO member (reg_id, id_card, course, candidate, prefix, prefixEN, line_id,
    name, lastname, name_en, lastname_en,nationality, birthday, tel, 
    email, address, educational, branch,province, 
    amphure, district, gender, permission, receipt, 
    profile_img, reg_day , kn_score, profi_score, sum_score, pass_fail, book_id,id_card_Img, educational_Img)    
    VALUES (?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, 
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) `;

  fs.mkdir(destinationDirectory, { recursive: true }, (err) => {
    if (err) {
      console.error(`Error creating directory: ${err}`);
      res.status(500).send("Internal Server Error");
      return;
    }

    fs.chmod(destinationDirectory, 0o777, (err) => {
      if (err) {
        console.error(`Error setting permissions on directory: ${err}`);
      } else {
        db.query(count_max_sql, (err, result) => {
          function padWithLeadingZeros(num, totalLength) {
            return String(num).padStart(totalLength, "0");
          }

          const reg_id = `REG_` + padWithLeadingZeros(result[0].id, 4);

          bcrypt.hash(id_card, saltRounds, function (err, hash) {
            db.query(
              query,
              [
                reg_id,
                hash,
                course,
                candidate,
                prefix,
                prefixEN,
                line_id,
                name,
                lastname,
                name_EN,
                lastname_EN,
                nationality,
                birthday,
                tel,
                email,
                address,
                educational,
                branch,
                province,
                amphure,
                district,
                gender,
                permission,
                receipt,
                img,
                reg_day,
                kn_score,
                profi_score,
                sum_score,
                pass_fail,
                book_id,
                id_card_img,
                educational_img,
              ],
              (err, result) => {
                if (err) {
                  res.send(err);
                  console.log(err);
                }
                // ดึง ID ของแถวที่เพิ่ง insert
                const insertedId = result.insertId;

                // สร้างคำสั่ง SQL เพื่อดึงข้อมูลที่เพิ่ง insert
                const selectSQL = "SELECT * FROM member WHERE id = ?";
                db.query(selectSQL, [insertedId], (error, rows) => {
                  if (error) {
                    console.error(
                      "เกิดข้อผิดพลาดในการดึงข้อมูล: " + error.message
                    );
                    return;
                  }
                  res.json({
                    STATUS: "ลงทะเบียนเสร็จสิ้น",
                    rows,
                    id_card: id_card,
                  });
                  // const text = ` กรุณาใช้ เลขประจำตัวการสอบ: ${rows[0].reg_id} '' เลขบัตรประจำตัวประชาชน: ${id_card} `;
                  // notiEvent(token_Line, text);
                });
              }
            );
          });
        });
        console.log(`Permissions set to 755 for ${destinationDirectory}`);
      }
    });
  });
});

//Pay
app.get("/check_payment/:id", (req, res) => {
  const reg_id = req.params.id;
  const query = `SELECT reg_id, id_card, course_name.name_th, course_name.name_en, candidate, prefix, name, lastname, nationality, tel, email, educational, branch, permission, receipt, gender, profile_img,
  CONCAT( DATE_FORMAT( birthday , '%d' ), '/', DATE_FORMAT( birthday , '%m' ) , '/', DATE_FORMAT( birthday , '%Y' ) +543 ) AS Thaibirthday, provinces.name_th AS province_name, amphures.name_th AS amphure_name, districts.name_th AS district_name
  FROM member
  INNER JOIN course_name 
  ON member.course=course_name.id
  INNER JOIN provinces 
  ON member.province=provinces.id
  INNER JOIN amphures
  on member.amphure=amphures.id
  INNER JOIN districts
  on member.district=districts.id
  WHERE reg_id = ?`;

  db.query(query, [reg_id], (err, result) => {
    if (result) {
      res.send(result);
    } else {
      res.send(err);
    }
  });
});

app.post("/auth_if", (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const token_auth = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token_auth, secret);
      res.json({ status: true, decoded });
      next();
    } catch (err) {
      res.json({ status: false, message: err.message });
    }
  }
});

app.get("/user_information/:id", (req, res) => {
  const id = req.params.id;
  db.query("SELECT * FROM member WHERE id = ?", id, (err, result) => {
    if (err) {
      res.json({ ERROR: err });
    } else {
      res.json({ Status: "OK", result });
    }
  });
});

//Check_idcard and Insert a user Information into a database

app.get("/get_provinces", (req, res) => {
  db.query(
    "SELECT id, name_th FROM provinces ORDER BY name_th ASC",
    (err, result) => {
      if (result === 0) {
        res.json({ Error: "Failed" });
      } else {
        res.send(result);
      }
    }
  );
});

app.get("/get_amphures/:province_id", (req, res) => {
  const province_id = req.params.province_id;
  db.query(
    "SELECT * FROM amphures WHERE province_id = ?",
    [province_id],
    (err, result) => {
      if (err) throw error;

      res.send(result);
    }
  );
});

app.get("/get_districts/:amphure_id", (req, res) => {
  const amphure_id = req.params.amphure_id;
  db.query(
    "SELECT * FROM districts WHERE amphure_id  = ?",
    [amphure_id],
    (err, result) => {
      if (err) throw error;

      res.send(result);
    }
  );
});

//---------------------------------------------------------------------------------------------------------------
//For admin

app.get("/do_not_pay", (req, res) => {
  const { page, pageSize } = req.query;
  const offset = (page - 1) * pageSize;

  db.query(
    `SELECT reg_id, course_name.name_th AS course_name_th, prefix, name, lastname,
     permission, receipt
    FROM member
    INNER JOIN course_name 
    ON member.course=course_name.id
    WHERE permission = "รอชำระเงิน" 
    ORDER BY reg_id DESC
    LIMIT ${offset}, ${pageSize};`,
    (err, results) => {
      if (err) {
        console.error(err);
        res.status(500).json({ err: "Internal Server Error" });
        return;
      }
      const totalCountQuery = `SELECT COUNT(*) AS totalCount FROM member`;
      db.query(totalCountQuery, (err, countResults) => {
        const totalCount = countResults[0].totalCount;
        const totalPages = Math.ceil(totalCount / pageSize);

        res.json({ data: results, totalPages });
      });
    }
  );
});

app.post("/admin_login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const sql = "SELECT * FROM admin WHERE username = ? AND password = ?";
  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error("Error executing Mysql Query:", err);
      res.status(500).json({ error: "An error occurred" });
    }
    if (result.length === 0) {
      res.json({
        Error: "กรุณาเข้าสู่ระบบใหม่อีกครั้ง Username หรือ Password ไม่ตรงกัน",
      });
    } else {
      res.json({ Status: "OK", result });
    }
  });
});

app.post("/add_admin", (req, res) => {
  const { name, lastname, tel, username, pwd, permission } = req.body;
  const sql =
    "INSERT INTO admin (name, lastname, tel, username, password, permission) VALUES (?, ?, ?, ?, ?, ?)";
  const user_exist = `SELECT * FROM admin WHERE username = ?`;
  db.query(user_exist, [username], (err, result_exist) => {
    if (result_exist.length === 1) {
      res.json({ STATUS: "ชื่อผู้ใช้มีผู้ใช้งานแล้ว" });
      return false;
    }
    if (err) {
      res.send(err);
    } else {
      db.query(
        sql,
        [name, lastname, tel, username, pwd, permission],
        (err, result) => {
          if (err) {
            res.send(err);
            console.log(err);
          } else {
            res.json({ STATUS: "เพิ่มข้อมูลเสร็จสิ้น" });
          }
        }
      );
    }
  });
});

app.get("/display_all_user/:course", (req, res) => {
  const month = req.params.month;
  const course = req.params.course;
  const { page, pageSize, fromDate, toDate } = req.query;
  const offset = (page - 1) * pageSize;

  // const query = `SELECT reg_id, id_card,course_name.name_th AS course_name_th, candidate, prefix, name, lastname, nationality, tel, email, educational, branch, permission, receipt, gender,
  //  CONCAT( DATE_FORMAT( reg_day , '%Y' ), '/', DATE_FORMAT( reg_day , '%m' ) , '/', DATE_FORMAT( reg_day , '%d' ) ) AS change_reg_day , provinces.name_th AS province_name, amphures.name_th AS amphure_name, districts.name_th AS district_name
  // FROM member m
  // INNER JOIN course_name
  // ON m.course=course_name.id
  // INNER JOIN provinces
  // ON m.province=provinces.id
  // INNER JOIN amphures
  // on m.amphure=amphures.id
  // INNER JOIN districts
  // on m.district=districts.id
  // WHERE m.permission = 'ผู้สมัคร' AND MONTH(reg_day) = ? AND course = ?
  // ORDER BY reg_id DESC
  // LIMIT ${offset}, ${pageSize}`;

  const query = `SELECT reg_id, CONCAT_WS('  ', name, lastname) AS ชื่อนามสกุล,  ' ' AS ลงชื่อมา, '13.00 น' AS เวลามา, ' ' AS ลงชื่อกลับ, '17.00 น. ' AS เวลากลับ
  FROM member m
  WHERE permission = 'ผู้สมัคร' AND reg_day >= ? AND reg_day <= ? AND course = ? AND pass_fail = ''
  ORDER BY reg_id DESC
  LIMIT ${offset}, ${pageSize}`;

  // const query_1 = `SELECT reg_id ,course_name.name_th AS course_name_th, candidate, prefix, name, lastname,
  // FROM member m
  // INNER JOIN course_name
  // ON m.course=course_name.id
  // WHERE m.permission = 'ผู้สมัคร' AND MONTH(reg_day) = ? AND course = ?
  // ORDER BY reg_id DESC
  // LIMIT ${offset}, ${pageSize}`;

  db.query(query, [fromDate, toDate, course], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ err: "Internal Server Error" });
      return;
    }

    const totalCountQuery = `SELECT COUNT(*) AS totalCount FROM member`;
    db.query(totalCountQuery, (err, countResults) => {
      // if (error) {
      //   console.error(error);
      //   res.status(500).json({ error: 'Internal Server Error' });
      //   return;
      // }
      const totalCount = countResults[0].totalCount;
      const totalPages = Math.ceil(totalCount / pageSize);

      res.json({ data: results, totalPages });
    });
  });
});

app.get("/display_all_user_edit", (req, res) => {
  const { page, pageSize } = req.query;
  const offset = (page - 1) * pageSize;

  const query = `SELECT reg_id, id_card, course_name.name_th AS course_name_th, candidate, prefix, name, lastname, nationality, tel, email, educational, branch, permission, receipt, gender,
  CONCAT( DATE_FORMAT( birthday , '%Y' ), '/', DATE_FORMAT( birthday , '%m' ) , '/', DATE_FORMAT( birthday , '%d' ) ) AS Thaibirthday, provinces.name_th AS province_name, amphures.name_th AS amphure_name, districts.name_th AS district_name
  FROM member
  INNER JOIN course_name
  ON member.course=course_name.id
  INNER JOIN provinces 
  ON member.province=provinces.id
  INNER JOIN amphures
  on member.amphure=amphures.id
  INNER JOIN districts
  on member.district=districts.id
  ORDER BY reg_id DESC
  LIMIT ${offset}, ${pageSize}`;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ err: "Internal Server Error" });
      return;
    }

    const totalCountQuery = `SELECT COUNT(*) AS totalCount FROM member`;
    db.query(totalCountQuery, (err, countResults) => {
      // if (error) {
      //   console.error(error);
      //   res.status(500).json({ error: 'Internal Server Error' });
      //   return;
      // }
      const totalCount = countResults[0].totalCount;
      const totalPages = Math.ceil(totalCount / pageSize);

      res.json({ data: results, totalPages });
    });
  });
});

//Get single user
app.get("/edit_user_info/:id", (req, res) => {
  const id = req.params.id;
  const query = `SELECT *
  FROM member
  WHERE reg_id = ?`;

  db.query(query, [id], (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});

app.get("/course_name", (req, res) => {
  const id = req.params.id;
  const query = `SELECT *
  FROM course_name`;

  db.query(query, (err, result) => {
    if (err) throw err;

    res.send(result);
  });
});

//Delete member
app.delete("/delete_member/:id", (req, res) => {
  const id = req.params.id;
  db.query("DELETE FROM member WHERE reg_id = ?", [id], (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});

//Update informations
app.put("/update_user_info", (req, res) => {
  const reg_id = req.body.reg_id;
  const name = req.body.name;
  const lastname = req.body.lastname;
  const gender = req.body.gender;
  const {
    name_EN,
    lastname_EN,
    province_id,
    amphure_id,
    district_id,
    birthday,
    course,
    candidate,
    prefix,
    nationality,
    tel,
    address,
    educational,
    branch,
    email,
  } = req.body;
  const sql_update = `UPDATE member SET name = ?, lastname = ?, province = ?, amphure = ?, district = ? ,gender = ?, name_EN = ?
    , lastname_EN = ?, birthday = ?, course = ?, candidate = ?, prefix = ?, nationality = ?, tel = ?
    ,address = ?, educational = ?, branch = ?, email = ? WHERE reg_id = ?`;

  db.query(
    sql_update,
    [
      name,
      lastname,
      province_id,
      amphure_id,
      district_id,
      gender,
      name_EN,
      lastname_EN,
      birthday,
      course,
      candidate,
      prefix,
      nationality,
      tel,
      address,
      educational,
      branch,
      email,
      reg_id,
    ],
    (err, result) => {
      if (err) {
        res.send(err);
        console.log(err);
      } else {
        res.json({ status: true });
      }
    }
  );
});

//update_permission
app.put("/update_permission", async (req, res) => {
  const reg_id = req.body;
  const permission = req.body.permission;
  const query_update = "UPDATE member SET permission = ? WHERE reg_id = ?";
  // console.log(req.body)

  await reg_id.forEach((items) => {
    db.query(query_update, ["ผู้สมัคร", items], async (err, result) => {
      if (err) {
        console.log(err);
      }
    });
  });
  // db.query(
  //   "UPDATE member SET permission = ? WHERE reg_id = ?",
  //   ['ผู้สมัคร', reg_id],
  //   (err, result) => {
  //     if (err) {
  //       res.send(err);
  //     } else {
  //       res.send({ status: true });
  //     }
  //   }
  // );
});

app.get("/user_score/:month/:course", (req, res) => {
  const month = req.params.month;
  const course = req.params.course;
  const { page, pageSize } = req.query;
  const offset = (page - 1) * pageSize;

  const query = `SELECT reg_id, id_card, course_name.name_th AS course_name_th, course,candidate, prefix, name, lastname, 
  nationality, tel, email, educational, branch, permission, receipt, gender, kn_score,
  profi_score, sum_score, pass_fail, CONCAT( DATE_FORMAT( reg_day , '%Y' ), '/', DATE_FORMAT( reg_day , '%m' ) , '/', DATE_FORMAT( reg_day , '%d' ) ) AS change_reg_day, provinces.name_th AS province_name, amphures.name_th AS amphure_name, districts.name_th AS district_name
  FROM member
  INNER JOIN course_name 
  ON member.course=course_name.id
  INNER JOIN provinces 
  ON member.province=provinces.id
  INNER JOIN amphures
  on member.amphure=amphures.id
  INNER JOIN districts
  on member.district=districts.id
  WHERE permission = "ผู้สมัคร" AND MONTH(reg_day) = ? AND course = ?
  ORDER BY reg_id DESC
  LIMIT ${offset}, ${pageSize};`;

  db.query(query, [month, course], (err, results) => {
    if (err) {
      res.send(err);
    }

    const totalCountQuery = `SELECT COUNT(*) AS totalCount FROM member`;
    db.query(totalCountQuery, (err, countResults) => {
      // if (error) {
      //   console.error(error);
      //   res.status(500).json({ error: 'Internal Server Error' });
      //   return;
      // }
      const totalCount = countResults[0].totalCount;
      const totalPages = Math.ceil(totalCount / pageSize);

      res.json({ data: results, totalPages });
    });
  });
});

app.get("/certifi_rp/:month/:course", (req, res) => {
  const month = req.params.month;
  const course = req.params.course;
  const { page, pageSize } = req.query;
  const offset = (page - 1) * pageSize;

  const query = `SELECT reg_id, id_card, course_name.name_th AS course_name_th,course, candidate, prefix, name, lastname, profile_img,
  nationality, tel, email, educational, branch, permission, receipt, gender, kn_score,book_id,
  profi_score, sum_score, pass_fail, CONCAT( DATE_FORMAT( reg_day , '%d' ), '/', DATE_FORMAT( reg_day , '%m' ) , '/', DATE_FORMAT( reg_day , '%Y' ) +543 ) AS change_reg_day, provinces.name_th AS province_name, amphures.name_th AS amphure_name, districts.name_th AS district_name
  FROM member
  INNER JOIN course_name
  ON member.course=course_name.id
  INNER JOIN provinces 
  ON member.province=provinces.id
  INNER JOIN amphures
  on member.amphure=amphures.id
  INNER JOIN districts
  on member.district=districts.id
  WHERE book_id != "" AND MONTH(reg_day) = ? AND course = ?
  ORDER BY reg_id DESC
  LIMIT ${offset}, ${pageSize};`;

  db.query(query, [month, course], (err, results) => {
    if (err) {
      res.send(err);
    }

    const totalCountQuery = `SELECT COUNT(*) AS totalCount FROM member`;
    db.query(totalCountQuery, (err, countResults) => {
      const totalCount = countResults[0].totalCount;
      const totalPages = Math.ceil(totalCount / pageSize);

      res.json({ data: results, totalPages });
    });
  });
});

app.get("/get_single_certi/:reg_id", (req, res) => {
  const reg_id = req.params.reg_id;

  const query = `SELECT reg_id, id_card, course_name.name_th AS course_name_th, course_name.name_en AS course_name_en, candidate, prefix, prefixEN,name, lastname, member.name_en, member.lastname_en,
  nationality, tel, email, educational, branch, permission, receipt, gender, kn_score, book_id,
  profi_score, sum_score, pass_fail, profile_img, CONCAT( DATE_FORMAT( reg_day , '%d' ), '/', DATE_FORMAT( reg_day , '%m' ) , '/', DATE_FORMAT( reg_day , '%Y' ) +543 ) AS change_reg_day, provinces.name_th AS province_name, amphures.name_th AS amphure_name, districts.name_th AS district_name
  FROM member
  INNER JOIN course_name 
  ON member.course=course_name.id
  INNER JOIN provinces 
  ON member.province=provinces.id
  INNER JOIN amphures
  on member.amphure=amphures.id
  INNER JOIN districts
  on member.district=districts.id
  WHERE reg_id = ?`;

  db.query(query, [reg_id], (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});

app.put("/cancel_permission/:reg_id", (req, res) => {
  const reg_id = req.params.reg_id;

  const query = `UPDATE member set permission = 'รอชำระเงิน' WHERE reg_id = ?`;

  db.query(query, [reg_id], (err, result) => {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});

app.put("/sum_score", async (req, res) => {
  const { reg_id, course, name, lastname } = req.body;
  const kn_score = req.body.kn_score;
  const profi_score = req.body.profi_score;
  const total_score = req.body.total_score;
  const pass_fail = req.body.pass_fail;
  const sql = `UPDATE member SET kn_score = ?, profi_score = ?, sum_score = ? , pass_fail = ?, book_id = ?
  WHERE reg_id = ?`;
  // const sql = `UPDATE member SET kn_score = ?, profi_score = ?, sum_score = ?, pass_fail = ?, book_id = ?
  // WHERE reg_id = ?`;
  const sql_book_id = "INSERT INTO book_id_value (id_values) VALUES (?)";
  const sql_book_id_2 = `UPDATE member SET profi_score = ? WHERE reg_id = ?`;
  const Array_score = req.body;
  const text = "";
  // console.log(Array_score)
  try {
    Array_score.forEach((response) => {
      const reg_id = response.reg_id;
      const kn_score = response.kn_score;
      const profi_score = response.profi_score;
      const result_score = kn_score + profi_score;

      if (result_score >= 70) {
        db.query(sql_book_id, [text], (err, result_1) => {
          function padWithLeadingZeros(num, totalLength) {
            return String(num).padStart(totalLength, "0");
          }
          const insertedId = result_1.insertId;
          const last_book_id = padWithLeadingZeros(insertedId, 4);

          db.query(
            sql,
            [kn_score, profi_score, result_score, "ผ่าน", last_book_id, reg_id],
            (err, result) => {
              if (err) throw err;
              console.log("Success");
            }
          );
        });
      } else if (total_score >= 50 && total_score <= 69) {
        db.query(
          sql,
          [kn_score, profi_score, result_score, "ผ่าน", "", reg_id],
          (err, result) => {
            if (err) {
              console.error(err);
            }
            console.log("Success");
          }
        );
      } else {
        db.query(
          sql,
          [kn_score, profi_score, result_score, "ไม่ผ่าน", "", reg_id],
          (err, result) => {
            if (err) {
              console.error(err);
            }
          }
        );
      }
    });

    res.json({ status: true });
  } catch (error) {}

  // if (Array_score[0].kn_score) {
  //   Array_score.forEach((res_1) => {
  //     const reg_id = res_1.reg_id;
  //     const kn_score = res_1.kn_score;
  //     db.query(sql_book_id, [kn_score, reg_id], (err, result) => {
  //       if (result) {
  //         res.json({ status: "true" });
  //       } else {
  //         console.error(err);
  //       }
  //     });
  //   });
  // } else {
  //   Array_score.forEach((res_1) => {
  //     const reg_id = res_1.reg_id;
  //     const profi_score = res_1.profi_score;
  //     db.query(sql_book_id_2, [profi_score, reg_id], (err, result) => {
  //       if (result) {
  //         res.json({ status: "true" });
  //       } else {
  //         console.error(err);
  //       }
  //     });
  //   });
  // }

  // if (total_score > 100) {
  //   res.json({ status: "กรุณากรอกคะแนนให้ถูกต้อง" });
  //   return false;
  // } else if (total_score > 69) {
  //   db.query(sql_book_id, text, (err, result_1) => {
  //     function padWithLeadingZeros(num, totalLength) {
  //       return String(num).padStart(totalLength, "0");
  //     }
  //     const insertedId = result_1.insertId;
  //     const last_book_id = padWithLeadingZeros(insertedId, 4);
  //     db.query(
  //       sql,
  //       [kn_score, profi_score, total_score, pass_fail, last_book_id, reg_id],
  //       (err, result) => {
  //         if (err) {
  //           res.json({ status: "false" });
  //           console.log(err);
  //         } else {
  //           res.json({ status: "true", result });
  //           // res.send(result)
  //         }
  //       }
  //     );
  //   });
  // } else if (total_score >= 50 && total_score <= 69) {
  //   db.query(
  //     sql,
  //     [kn_score, profi_score, total_score, "ผ่าน", "", reg_id],
  //     (err, result) => {
  //       if (err) {
  //         res.json({ status: "false" });
  //         console.log(err);
  //       } else {
  //         res.json({ status: "true" });
  //       }
  //     }
  //   );
  // } else {
  //   db.query(
  //     sql,
  //     [kn_score, profi_score, total_score, "ไม่ผ่าน", "", reg_id],
  //     (err, result) => {
  //       if (err) {
  //         res.json({ status: "false" });
  //         console.log(err);
  //       } else {
  //         res.json({ status: "true" });
  //       }
  //     }
  //   );
  // }
});

app.listen(PORT, () => console.log("Server is running on port " + PORT));
