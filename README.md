# DashView

A custom Home Assistant integration that provides a customizable dashboard view built with HTML, Python, and JavaScript.

## Features

- Custom dashboard view accessible from the Home Assistant sidebar
- Built-in HTML, CSS, and JavaScript framework
- Easy to extend with custom widgets and functionality
- HACS compatible for easy installation
- No manual configuration required

## Installation

### Via HACS (Recommended)

1. Open HACS in your Home Assistant instance
2. Go to "Integrations"
3. Click the "+" button and search for "DashView"
4. Download and install the integration
5. Restart Home Assistant
6. The DashView panel will automatically appear in your sidebar

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/mholzi/dashview/releases)
2. Extract the files to your `custom_components/dashview/` directory
3. Restart Home Assistant
4. The DashView panel will automatically appear in your sidebar

## Usage

Once installed, DashView will automatically create a new panel in your Home Assistant sidebar called "DashView". Click on it to access your custom dashboard.

The integration provides a foundation for creating custom dashboard widgets and functionality using HTML, CSS, and JavaScript.

## Troubleshooting

If you experience issues like a black screen or components not loading:

1. **Black Screen Fix**: Update to the latest version - a critical syntax error has been fixed
2. **Enable Debug Mode**: Run `localStorage.setItem('dashview_debug', 'true')` in browser console, then reload
3. **Use Debug Tools**: Access `DashViewDebug.diagnose()` and other tools in browser console
4. **Check Files**: Ensure all required files exist in `/local/dashview/` directory

For detailed troubleshooting instructions, see [DEBUGGING.md](DEBUGGING.md).

## Development

The integration is designed to be easily extensible. You can modify the dashboard content by editing the HTML template in the integration code or by creating additional custom components.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
