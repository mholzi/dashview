"""The DashView custom integration."""
import logging
from aiohttp.web import Response
from homeassistant.core import HomeAssistant
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.frontend import add_extra_js_url, async_register_built_in_panel
from homeassistant.components.http import HomeAssistantView
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN
from .services import async_setup_services, async_unload_services

_LOGGER = logging.getLogger(__name__)


class DashViewPanel(HomeAssistantView):
    """View to serve the DashView panel."""

    url = "/dashview"
    name = "dashview"
    requires_auth = False

    async def get(self, request):
        """Serve the DashView HTML."""
        html_content = """
<!DOCTYPE html>
<html>
<head>
    <title>DashView - Home</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/@mdi/font@6.x/css/materialdesignicons.min.css" rel="stylesheet">
    <style>
        /* mysmarthome Theme */
        :root {
            --primary-font-family: 'Space Grotesk', sans-serif;
            --horizontal-stack-card-margin: 0px 6px;
            --vertical-stack-card-margin: 12px;
            --grid-card-gap: 12px;
            --ha-card-border-width: 0px;
            --ha-card-box-shadow: 0px 0px 0px 0px rgba(0,0,0,0);
            --ha-card-border-radius: 30px;
            --masonry-view-card-margin: 4px 4px;
            --vertical-stack-card-gap: 0px;
            --stack-card-gap: 0px;

            /* Colors */
            --orange: #ffd1b1;
            --green: #c5e4ac;
            --blue: #c8ddfa;
            --blue-dark: #abcbf8;
            --red: #f0a994;
            --purple: #e3d4f6;
            --yellow: #faedae;

            /* Gradients */
            --active-light1: linear-gradient(145deg, rgba(251,192,217,1) 0%, rgba(255,212,193,1) 100%);
            --active-small: linear-gradient(145deg, rgba(255,212,193,1) 0%, rgba(248,177,235,1) 100%);
            --active-big: linear-gradient(145deg, rgba(255,220,178,1) 0%, rgba(255,176,233,1) 60%, rgba(104,156,255,1) 150%);
            --active-light: linear-gradient(145deg, rgba(255,245,200,1) 0%, rgba(255,225,130,1) 60%, rgba(255,200,90,1) 150%);
            --active-appliances: linear-gradient(145deg, rgba(220,245,220,1) 0%, rgba(200,235,200,1) 60%, rgba(180,225,180,1) 150%);

            /* Base Colors */
            --black: #28282A;
            --white: #f5f7fa;

            /* Light Mode */
            --background: #f5f7fa;
            --popupBG: #fafbfc;
            --gray000: #edeff2;
            --gray100: #e9eaec;
            --gray200: #d6d7d9;
            --gray300: #b6b7b9;
            --gray400: #909193;
            --gray500: #707173;
            --gray600: #494a4c;
            --gray700: #313233;
            --gray800: #0f0f10;
            --primary-text-color: var(--gray800);
            --secondary-text-color: var(--gray500);
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --background: #28282A;
                --popupBG: #28282A;
                --gray000: #3a3b3d;
                --gray100: #353637;
                --gray200: #404142;
                --gray300: #555658;
                --gray400: #737476;
                --gray500: #939496;
                --gray600: #c8c9cb;
                --gray700: #eff0f2;
                --gray800: #ffffff;
                --primary-text-color: var(--gray800);
                --secondary-text-color: var(--gray500);
            }
        }

        body {
            font-family: var(--primary-font-family);
            background-color: var(--background);
            color: var(--primary-text-color);
            margin: 0;
            padding: 10px;
        }

        .vertical-layout {
            display: flex;
            flex-direction: column;
            gap: var(--vertical-stack-card-margin, 12px);
            width: 100%;
            max-width: 300px;
            margin: auto;
        }

        .card {
            background-color: var(--ha-card-background, var(--gray000));
            border-radius: var(--ha-card-border-radius, 30px);
            padding: 16px;
            box-shadow: var(--ha-card-box-shadow);
            border-width: var(--ha-card-border-width, 0px);
        }

        .grid-layout {
            display: grid;
            gap: var(--grid-card-gap, 12px);
        }

        .horizontal-stack {
            display: flex;
            gap: var(--horizontal-stack-card-margin, 6px);
        }

        .placeholder {
            border: 2px dashed var(--gray400);
            padding: 10px;
            text-align: center;
            color: var(--gray500);
        }

        /* Popup styles */
        .popup {
            display: none;
            position: fixed;
            z-index: 10;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            overflow: auto;
            background-color: rgba(0,0,0,0.4);
        }
        .popup:target {
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .popup-content {
            background-color: var(--popupBG);
            margin: auto;
            padding: 20px;
            border-radius: 15px;
            width: 90%;
            max-width: 500px;
            position: relative;
        }
        .close-popup {
            color: var(--gray500);
            position: absolute;
            top: 10px;
            right: 20px;
            font-size: 28px;
            font-weight: bold;
            text-decoration: none;
        }

    </style>
</head>
<body>

    <div class="vertical-layout">
        <div class="card" style="padding:0;">
            <div class="grid-layout" style="grid-template-columns: min-content 1fr max-content;">
                <div class="placeholder">kiosk_button</div>
                <div></div>
                <div class="card" style="border-radius: 10px; padding: 0;">
                    <div class="horizontal-stack">
                        <div class="placeholder">header_weather</div>
                        <div class="placeholder">header_person</div>
                    </div>
                </div>
            </div>
        </div>
        <div class="placeholder card">!include dashboard/lovelace_gen/header_room_icons.yaml</div>
        <div class="placeholder card">!include dashboard/decluttering/alarm.yaml</div>
        <div class="placeholder card">!include dashboard/lovelace_gen/scene_button.yaml</div>
        <div class="placeholder card">!include dashboard/decluttering/header_updates.yaml</div>
        <div class="placeholder card">!include dashboard/decluttering/info_text.yaml</div>
        <div id="weather" class="popup">
            <div class="popup-content">
                <a href="#" class="close-popup">&times;</a>
                <h2>Wetter</h2>
                <div class="placeholder">DWD Warning</div>
                <div class="placeholder">Weather Forecast Card</div>
                <div class="placeholder">Hourly Forecast</div>
                <div class="placeholder">Swipe Card for weather</div>
                <div class="placeholder">Pollen Card</div>
            </div>
        </div>

        <div id="security" class="popup">
            <div class="popup-content">
                <a href="#" class="close-popup">&times;</a>
                <h2>Sicherheit</h2>
                <div class="placeholder">Security content</div>
            </div>
        </div>

        <div class="card" style="position: fixed; bottom: 10px; left: 10px; right: 10px; width: calc(100% - 20px); border-radius: 100px; background: var(--gray800); padding: 10px; z-index: 5;">
             <div class="grid-layout" style="grid-template-columns: repeat(5, 1fr); justify-items: center;">
                <a href="#aussen" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-tree" style="font-size: 24px;"></i></a>
                <a href="#security" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-security" style="font-size: 24px;"></i></a>
                <a href="#calendar" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-calendar" style="font-size: 24px;"></i></a>
                <a href="#music" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-music" style="font-size: 24px;"></i></a>
                <a href="#settings" style="color: var(--gray000); text-decoration: none;"><i class="mdi mdi-tune-variant" style="font-size: 24px;"></i></a>
            </div>
        </div>
    </div>

    <div id="buero" class="popup"><div class="popup-content"><a href="#" class="close-popup">&times;</a><h2>Büro</h2><div class="placeholder">Room content</div></div></div>
    <div id="wohnzimmer" class="popup"><div class="popup-content"><a href="#" class="close-popup">&times;</a><h2>Wohnzimmer</h2><div class="placeholder">Room content</div></div></div>
    <div id="kueche" class="popup"><div class="popup-content"><a href="#" class="close-popup">&times;</a><h2>Küche</h2><div class="placeholder">Room content</div></div></div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Simple hash-based popup logic
            function checkHash() {
                const hash = window.location.hash;
                const popups = document.querySelectorAll('.popup');
                popups.forEach(popup => {
                    if ('#' + popup.id === hash) {
                        popup.style.display = 'flex';
                    } else {
                        popup.style.display = 'none';
                    }
                });
            }

            window.addEventListener('hashchange', checkHash, false);

            // Close popups when clicking on the close button
            document.querySelectorAll('.close-popup').forEach(button => {
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    window.location.hash = '#';
                });
            });

            // Initial check
            checkHash();
        });
    </script>

</body>
</html>
        """
        return Response(text=html_content.strip(), content_type="text/html")


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the DashView component."""
    _LOGGER.info("Setting up DashView integration")
    
    hass.http.register_view(DashViewPanel())
    
    if "dashview" not in hass.data.get("frontend_panels", {}):
      async_register_built_in_panel(
          hass,
          "iframe",
          "DashView",
          "mdi:view-dashboard",
          "dashview",
          {"url": "/dashview"},
          require_admin=False,
      )
    
    await async_setup_services(hass)
    
    if not hass.config_entries.async_entries(DOMAIN):
        hass.async_create_task(
            hass.config_entries.flow.async_init(
                DOMAIN, context={"source": "import"}, data={}
            )
        )
    
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up DashView from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    await async_unload_services(hass)
    # You may need to add code here to remove the panel if you want it to disappear when the integration is unloaded.
    return True
