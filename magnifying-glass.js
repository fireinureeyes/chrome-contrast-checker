chrome.runtime.onMessage.addListener(function transfer(config, sender){

var osCompensation;
const getOS = () => {
    if (navigator.userAgent.indexOf('Windows') > -1) {
      return 'Windows'
    }
    if (navigator.userAgent.indexOf('Mac') > -1) {
      return 'Mac'
    }
    if (navigator.userAgent.indexOf('Linux') > -1) {
      return 'Linux'
    }
    return 'Unknown'
  }
if (getOS() == 'Mac') {osCompensation = 200} else {osCompensation = 100}

    // Do nothing if a magnifying glass has already been summoned
    if (document.getElementById("_bottom_layer")){
        $('._magnify_scope').remove();
        chrome.runtime.onMessage.removeListener(transfer);
        return;
    }
    // Create new div for the magnifier
    $('body').after('<div class="_magnify_scope"><div id="_bottom_layer" tabindex="0"></div></div>');

    // Create heatmap canvas
    var heatmapCanvas = document.createElement('canvas');
    heatmapCanvas.style.position = 'absolute';
    heatmapCanvas.style.pointerEvents = 'none';
    heatmapCanvas.style.opacity = '0.5';
    heatmapCanvas.style.borderRadius = config.magnifier_shape + "%";
    document.getElementById('_bottom_layer').appendChild(heatmapCanvas);

    // Create black circle
    var blackCircle = document.createElement('div');
    blackCircle.style.position = 'absolute';
    blackCircle.style.width = '5px';
    blackCircle.style.height = '5px';
    blackCircle.style.backgroundColor = 'white';
    blackCircle.style.borderRadius = '50%';
    blackCircle.style.top = '50%';
    blackCircle.style.left = '50%';
    blackCircle.style.transform = 'translate(-50%, -50%)';
    blackCircle.style.pointerEvents = 'none';
    document.getElementById('_bottom_layer').appendChild(blackCircle);

    var imageUrl = config.snapshot_url;

    if (getOS() == 'Mac') {
    var magniSize = osCompensation;
    } else {
        var zoom = config.page_zoom * (config.os_compensation / 100);
        var magniSize = config.magnifier_size / zoom;   
    }

    var originalStrength = config.magnifier_str;
    var temporaryStrength = config.magnifier_str2;

    // Remove the listener since it's no longer needed
    chrome.runtime.onMessage.removeListener(transfer);

    // Get the dimension of scrollbars
    var scroll_width = (window.innerWidth - $(window).width());
    var scroll_height = (window.innerHeight - $(window).height());

    var magnifier = document.getElementById("_bottom_layer");
    magnifier.style.imageRendering = "pixelated";
    
    magnifier.style.borderRadius = 99999 + "%";
    magnifier.style.background = "url('" + imageUrl + "') no-repeat";
    magnifier.style.transform = "scale(" + 1 + ")";
    magnifier.style.width = magniSize / 1 + "px";
    magnifier.style.height = magniSize / 1 + "px";
    magnifier.style.boxShadow = "0 0 0 " + 7 / 1 + "px rgba(255, 255, 255, 0.85), " +
        "0 0 " + 7 / 1 + "px " + 7 / 1 + "px rgba(0, 0, 0, 0.25), " +
        "inset 0 0 " + 40 / 1 + "px " + 2 / 1 + "px rgba(0, 0, 0, 0.25)";

    $('._magnify_scope').mousemove(function (e) {

        // Fade-in and fade-out the glass if the mouse is inside the page
        if (e.clientX < $(this).width() - scroll_width - 1 && e.clientY < $(this).height() - scroll_height - 4
            && e.clientX > 0 && e.clientY > 0) {
            $('#_bottom_layer').fadeIn(100);
            // Focus the bottom layer to allow keypress events
            $('#_bottom_layer').focus();
        }
        else {
            $('#_bottom_layer').fadeOut(100);
        }

        if ($('#_bottom_layer').is(':visible')) {
            // Calculate the relative position of large image
            if (getOS() == 'Mac') {
                var x_offset = -1 * (e.clientX - $('#_bottom_layer').width() / 2) * 1;
                var y_offset = -1 * (e.clientY - $('#_bottom_layer').height() / 2) * 1;
            } else {
                var x_offset = -1 * (e.clientX - $('#_bottom_layer').width() / 2) * zoom;
                var y_offset = -1 * (e.clientY - $('#_bottom_layer').height() / 2) * zoom;
            }
            var bg_position = x_offset + "px " + y_offset + "px";

            // Move the magnifying glass with the mouse
            var x_position = e.clientX - $('#_bottom_layer').width() / 2;
            var y_position = e.clientY - $('#_bottom_layer').height() / 2;

            if (getOS() == 'Mac') {
            $("#_bottom_layer").css({ left: x_position, top: y_position, backgroundPosition: bg_position, backgroundSize: "50%" });
            } else {
            $("#_bottom_layer").css({ left: x_position, top: y_position, backgroundPosition: bg_position });
            }

            // Extract the pixel color from the screenshot
            var img = new Image();
            img.src = imageUrl;
            img.onload = function () {
                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;

                // Update heatmap
                var heatmapContext = heatmapCanvas.getContext('2d', { willReadFrequently: true });
                if (getOS() == 'Mac') {
                heatmapCanvas.width = 200;
                heatmapCanvas.height = 200;
                } else {
                    heatmapCanvas.width = magniSize;
                heatmapCanvas.height = magniSize;  
                };
                if (getOS() == 'Mac') {
                    heatmapContext.drawImage(img, x_position*2, y_position*2, 800, 800, 0, 0, 400, 400);
                } else {
                    heatmapContext.drawImage(img, x_position, y_position, magniSize, magniSize, 0, 0, heatmapCanvas.width, heatmapCanvas.height);
                }
                var heatmapData = heatmapContext.getImageData(0, 0, heatmapCanvas.width, heatmapCanvas.height);
                var midpixel = heatmapData.data.length/2+heatmapData.data.length/magniSize/2;
                var midpixelcolor = [heatmapData.data[midpixel], heatmapData.data[midpixel+1], heatmapData.data[midpixel+2]];
                for (var i = 0; i < heatmapData.data.length; i += 4) {
                    var r = heatmapData.data[i];
                    var g = heatmapData.data[i + 1];
                    var b = heatmapData.data[i + 2];
                    var contrast = getContrast([r, g, b], midpixelcolor);
                    var currentStrength = e.shiftKey ? temporaryStrength : originalStrength;
                    if (e.shiftKey != true) {
                        if (contrast < currentStrength) {
                            heatmapData.data[i] = 255; // Red
                            heatmapData.data[i + 1] = 0;
                            heatmapData.data[i + 2] = 0;
                        } else {
                            heatmapData.data[i] = 0;
                            heatmapData.data[i + 1] = 255; // Green
                            heatmapData.data[i + 2] = 0;
                        }
                    } else {
                        if (contrast < currentStrength) {
                            heatmapData.data[i] = 150;
                            heatmapData.data[i + 1] = 0;
                            heatmapData.data[i + 2] = 0;
                        } else {
                            heatmapData.data[i] = 0;
                            heatmapData.data[i + 1] = 150;
                            heatmapData.data[i + 2] = 0;
                        }
                    }
                }
                heatmapContext.putImageData(heatmapData, 0, 0);
            };

            function getContrast(rgb1, rgb2) {
                var lum1 = getLuminance(rgb1);
                var lum2 = getLuminance(rgb2);
                var brightest = Math.max(lum1, lum2);
                var darkest = Math.min(lum1, lum2);
                return (brightest + 0.05) / (darkest + 0.05);
            }

            function getLuminance(rgb) {
                var a = rgb.map(function (v) {
                    v /= 255;
                    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                });
                return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
            }
        };
    });

    $('#_bottom_layer').on('wheel', function (e) {
            $('._magnify_scope').remove();
            if (e.keyCode == 27) {
            }
        return;
    })
    $('#_bottom_layer').on('keydown', function (e) {
        if (e.keyCode == 27) {
            $('._magnify_scope').remove();
        }
    return;
})
});