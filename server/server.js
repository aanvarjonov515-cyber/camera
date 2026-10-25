const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();

/* =========================================================
   CONFIG
========================================================= */

const PORT = 3000;

// camera_web/
const ROOT_DIR = path.resolve(__dirname, "..");

// camera_web/uploads/
const UPLOADS_DIR = path.join(ROOT_DIR, "uploads");

/*
    uploads papkasi yo‘q bo‘lsa avtomatik yaratiladi.
*/
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, {
        recursive: true
    });
}


/* =========================================================
   MULTER STORAGE
========================================================= */

const storage = multer.diskStorage({

    destination: function (
        req,
        file,
        callback
    ) {

        callback(
            null,
            UPLOADS_DIR
        );

    },


    filename: function (
        req,
        file,
        callback
    ) {

        const now = new Date();

        const year =
            now.getFullYear();

        const month =
            String(
                now.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const day =
            String(
                now.getDate()
            ).padStart(
                2,
                "0"
            );

        const hour =
            String(
                now.getHours()
            ).padStart(
                2,
                "0"
            );

        const minute =
            String(
                now.getMinutes()
            ).padStart(
                2,
                "0"
            );

        const second =
            String(
                now.getSeconds()
            ).padStart(
                2,
                "0"
            );


        const randomPart =
            crypto
                .randomBytes(4)
                .toString("hex");


        const fileName =
            `photo_${year}-${month}-${day}_${hour}-${minute}-${second}_${randomPart}.jpg`;


        callback(
            null,
            fileName
        );

    }

});


/* =========================================================
   FILE FILTER
========================================================= */

const fileFilter = function (
    req,
    file,
    callback
) {

    const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    ];


    if (
        allowedTypes.includes(
            file.mimetype
        )
    ) {

        callback(
            null,
            true
        );

    }

    else {

        callback(
            new Error(
                "Faqat rasm fayllariga ruxsat beriladi."
            ),
            false
        );

    }

};


/* =========================================================
   UPLOAD CONFIG
========================================================= */

const upload = multer({

    storage: storage,

    fileFilter: fileFilter,

    limits: {

        // Maximum 10 MB
        fileSize:
            10 * 1024 * 1024

    }

});


/* =========================================================
   STATIC FILES
========================================================= */

/*
    index.html
    style.css
    script.js
    gallery.html
*/

app.use(
    express.static(
        ROOT_DIR
    )
);


/*
    uploads/ ichidagi rasmlarni browserga ko‘rsatish.
*/

app.use(
    "/uploads",
    express.static(
        UPLOADS_DIR
    )
);


/* =========================================================
   HOME PAGE
========================================================= */

app.get(
    "/",
    (req, res) => {

        res.sendFile(
            path.join(
                ROOT_DIR,
                "index.html"
            )
        );

    }
);


/* =========================================================
   UPLOAD PHOTO
========================================================= */

app.post(
    "/upload",

    upload.single(
        "photo"
    ),

    (req, res) => {

        try {

            if (!req.file) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Rasm topilmadi."

                    });

            }


            console.log(
                "✅ Yangi surat saqlandi:"
            );

            console.log(
                req.file.filename
            );


            return res.json({

                success: true,

                message:
                    "Surat muvaffaqiyatli saqlandi.",

                photo: {

                    name:
                        req.file.filename,

                    url:
                        `/uploads/${req.file.filename}`,

                    size:
                        req.file.size

                }

            });

        }

        catch (error) {

            console.error(
                "Upload error:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Rasmni saqlashda server xatosi."

                });

        }

    }

);


/* =========================================================
   GET ALL PHOTOS
========================================================= */

app.get(
    "/api/photos",

    async (req, res) => {

        try {

            const files =
                await fs.promises.readdir(
                    UPLOADS_DIR
                );


            const allowedExtensions = [
                ".jpg",
                ".jpeg",
                ".png",
                ".webp"
            ];


            const photos = [];


            for (
                const fileName
                of files
            ) {

                const extension =
                    path
                        .extname(fileName)
                        .toLowerCase();


                if (
                    !allowedExtensions.includes(
                        extension
                    )
                ) {

                    continue;

                }


                const filePath =
                    path.join(
                        UPLOADS_DIR,
                        fileName
                    );


                const stats =
                    await fs.promises.stat(
                        filePath
                    );


                photos.push({

                    name:
                        fileName,

                    url:
                        `/uploads/${encodeURIComponent(fileName)}`,

                    size:
                        stats.size,

                    createdAt:
                        stats.birthtime

                });

            }


            /*
                Eng yangi rasm birinchi chiqadi.
            */

            photos.sort(
                (a, b) => {

                    return (
                        new Date(
                            b.createdAt
                        ).getTime()
                        -
                        new Date(
                            a.createdAt
                        ).getTime()
                    );

                }
            );


            return res.json({

                success: true,

                count:
                    photos.length,

                photos:
                    photos

            });

        }

        catch (error) {

            console.error(
                "Gallery error:",
                error
            );


            return res
                .status(500)
                .json({

                    success: false,

                    message:
                        "Rasmlar ro‘yxatini olishda xatolik.",

                    photos: []

                });

        }

    }

);


/* =========================================================
   GALLERY PAGE
========================================================= */

app.get(
    "/gallery",
    (req, res) => {

        res.sendFile(
            path.join(
                ROOT_DIR,
                "gallery.html"
            )
        );

    }
);


/* =========================================================
   API STATUS
========================================================= */

app.get(
    "/api/status",
    (req, res) => {

        res.json({

            success: true,

            server:
                " Web Server",

            status:
                "online",

            uploadsDirectory:
                "ready",

            time:
                new Date()

        });

    }
);


/* =========================================================
   MULTER / SERVER ERROR HANDLER
========================================================= */

app.use(
    (
        error,
        req,
        res,
        next
    ) => {

        console.error(
            "Server error:",
            error
        );


        if (
            error instanceof
            multer.MulterError
        ) {

            if (
                error.code ===
                "LIMIT_FILE_SIZE"
            ) {

                return res
                    .status(400)
                    .json({

                        success: false,

                        message:
                            "Rasm hajmi 10 MB dan katta bo‘lishi mumkin emas."

                    });

            }


            return res
                .status(400)
                .json({

                    success: false,

                    message:
                        error.message

                });

        }


        return res
            .status(500)
            .json({

                success: false,

                message:
                    error.message ||
                    "Server xatosi."

            });

    }
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
    PORT,
    "127.0.0.1",
    () => {

        console.log("");
        console.log(
            "=========================================="
        );

        console.log(
            "  WEB SERVER"
        );

        console.log(
            "=========================================="
        );

        console.log("");

        console.log(
            `✅ Server ishlayapti:`
        );

        console.log(
            `http://localhost:${PORT}`
        );

        console.log("");

        console.log(
            "bosh sahifa:"
        );

        console.log(
            `http://localhost:${PORT}/`
        );

        console.log("");

        console.log(
            `🖼 Gallery:`
        );

        console.log(
            `http://localhost:${PORT}/gallery.html`
        );

        console.log("");

        console.log(
            ``
        );

        console.log(
            UPLOADS_DIR
        );

        console.log("");

        console.log(
            "=========================================="
        );

    }
);