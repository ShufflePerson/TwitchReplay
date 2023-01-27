
let twitch_username = "xqc";
let stream_title = "";
let settings= {};

function render_twitch() {
    new Twitch.Embed("twitch-embed", {
        channel: twitch_username,
        parent: ["localhost"],
        muted: true,
        autoplay: false,
        layout: "video"
    });
}

function set_data() {
    fetch("/api/get_config")
        .then(response => response.json())
        .then(data => {
            console.debug(data)
            twitch_username = data.channel_name;
            stream_title = data.title;
            settings = data.settings;
            render_twitch();
            update_elements();
        });
}

function add_clips(data) {
    //data.clips is array of clip file names


    data.clips.forEach(function (clip) {
        //div with id  "template_clip" is the template for the clips
        let template = document.getElementById("template_clip");
        let clone = template.cloneNode(true);
        clone.id = clip;
        clone.style.display = "block";
        clone.children[0].src = clip;
        clone.children[0].onclick = function () {
            if (clone.children[0].paused)
                clone.children[0].play();
            else
                clone.children[0].pause();
  
        };
        document.getElementById("clips").appendChild(clone);

    });

    document.getElementById("template_clip").remove();
}

function set_clips() {
    fetch("/api/clips")
        .then(response => response.json())
        .then(data => {
            add_clips(data);
        });
}

function update_elements() {
    document.getElementById("streamer_title").innerHTML = stream_title;
    document.getElementById("streamer_name").innerHTML = twitch_username;

    Object.keys(settings).forEach(function (key) {
        let element = document.getElementsByName(key);
        if (element) {
            if(element && element[0])
            element[0].value = settings[key];
        }
    });

    set_clips();
}

function clip() {
    document.getElementById("in_progress").style.display = "block";
    fetch("/api/clip", {
        method: "POST",
    }).then(response => response.json())
        .then(data => {
            console.log(data);
            document.getElementById("in_progress").style.display = "none";
            add_clips(data);
        }).catch((x) => {
            console.error(x);
            alert("Error while clipping");
        });

}


set_data();






var slider = document.getElementById("slider");

slider.oninput = (() => {
    document.getElementById("clip_btn").innerHTML = "CLIP " + slider.value + " MINUTES";
})

slider.value = 5;
document.getElementById("clip_btn").innerHTML = "CLIP " + slider.value + " MINUTES";
