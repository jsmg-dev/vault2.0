const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');

// System command execution endpoint
router.post('/execute', async (req, res) => {
  try {
    const { command, type, target } = req.body;
    
    console.log('System command received:', { command, type, target });
    
    let systemCommand = '';
    
    switch (type) {
      case 'open_browser':
        systemCommand = 'start "" "https://www.google.com"';
        break;
        
      case 'open_explorer':
        systemCommand = 'explorer .';
        break;
        
      case 'open_notepad':
        systemCommand = 'notepad';
        break;
        
      case 'open_calculator':
        systemCommand = 'calc';
        break;
        
      case 'open_cmd':
        systemCommand = 'cmd';
        break;
        
      case 'open_powershell':
        systemCommand = 'powershell';
        break;
        
      case 'open_project':
        systemCommand = `explorer "${path.join(__dirname, '..', '..')}"`;
        break;
        
      case 'start_menu':
        systemCommand = 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^{ESC}\')"';
        break;
        
      case 'show_desktop':
        systemCommand = 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^d\')"';
        break;
        
      case 'task_manager':
        systemCommand = 'powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait(\'^+{ESC}\')"';
        break;
        
      case 'custom':
        systemCommand = command;
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Unknown command type' 
        });
    }
    
    // Execute the system command
    exec(systemCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('Command execution error:', error);
        return res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
      
      console.log('Command executed successfully:', systemCommand);
      res.json({ 
        success: true, 
        message: 'Command executed successfully',
        command: systemCommand,
        output: stdout 
      });
    });
    
  } catch (error) {
    console.error('System command error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Get available system commands
router.get('/commands', (req, res) => {
  const availableCommands = [
    { type: 'open_browser', description: 'Open web browser' },
    { type: 'open_explorer', description: 'Open File Explorer' },
    { type: 'open_notepad', description: 'Open Notepad' },
    { type: 'open_calculator', description: 'Open Calculator' },
    { type: 'open_cmd', description: 'Open Command Prompt' },
    { type: 'open_powershell', description: 'Open PowerShell' },
    { type: 'open_project', description: 'Open project folder' },
    { type: 'start_menu', description: 'Open Start Menu' },
    { type: 'show_desktop', description: 'Show desktop' },
    { type: 'task_manager', description: 'Open Task Manager' }
  ];
  
  res.json({ 
    success: true, 
    commands: availableCommands 
  });
});

module.exports = router;
