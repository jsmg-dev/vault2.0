import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { MainLayoutComponent } from '../../components/layout/main-layout.component';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AISHAEmotion {
  type: 'happy' | 'sad' | 'neutral' | 'thinking' | 'excited';
  intensity: number;
}

// Removed BreadcrumbItem interface for standalone page

@Component({
  selector: 'app-aisha',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  templateUrl: './aisha.component.html',
  styleUrl: './aisha.component.css'
})
export class AISHAComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;

  messages: Message[] = [];
  currentMessage: string = '';
  isTyping: boolean = false;
  isListening: boolean = false;
  isSpeaking: boolean = false;
  voiceEnabled: boolean = true;
  ttsEnabled: boolean = true;
  // AISHA properties
  userRole: string = '';
  
  // AISHA Avatar State
  currentEmotion: AISHAEmotion = { type: 'neutral', intensity: 0.5 };
  isBlinking: boolean = false;
  isGlowing: boolean = false;
  currentLipShape: string = 'neutral';
  lipSyncInterval: any;
  avatarAnimation: string = 'idle';

  // Speech Recognition
  private recognition: any;
  private synthesis: any;
  private lastResponseTime: number = 0;
  private responseCooldown: number = 1000; // 1 second cooldown for non-important commands
  private isWaitingForUser: boolean = false;
  private lastUserMessage: string = '';
  private shouldListenContinuously: boolean = true;
  private isStarting: boolean = false;
  private consecutiveFailures: number = 0;
  private maxFailures: number = 3;
  protected listeningMode: 'auto' | 'manual' = 'auto'; // Controls whether to restart on onend
  
  // Navigation subscription for refreshing session data
  private navigationSubscription?: Subscription;

  constructor(private router: Router) {}

  ngOnInit() {
    this.refreshSessionData();
    this.setupNavigationListener();
    this.initializeSpeechRecognition();
    this.initializeSpeechSynthesis();
    this.addWelcomeMessage();
    this.startBlinkingAnimation();
    this.startLipSyncAnimation();
    this.startContinuousListening();
    this.listeningMode = 'auto'; // Auto-restart is default
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  private initializeSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      console.log('🎤 Initializing speech recognition...');
      this.setupSpeechRecognition();
    } else {
      console.error('Speech recognition not supported');
    }
  }

  private setupSpeechRecognition() {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true; // Enable continuous listening
    this.recognition.interimResults = true; // Enable interim results for better responsiveness
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 3;

    this.recognition.onresult = (event: any) => {
      console.log('🎤 Speech recognition results:', event.results);
      
      // Process only final results (not interim)
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        
        if (result.isFinal) {
          // Get the best result
          let transcript = result[0].transcript.toLowerCase().trim();
          console.log('🎤 Final transcript:', transcript);
          
          // Skip empty or very short transcripts
          if (transcript.length < 2) {
            console.log('🎤 Skipping short transcript:', transcript);
            continue;
          }
          
          // Check for cooldown to prevent repeated responses (but allow important commands)
          const currentTime = Date.now();
          const isImportantCommand = this.isImportantCommand(transcript);
          
          if (!isImportantCommand && currentTime - this.lastResponseTime < this.responseCooldown) {
            console.log('🎤 Response cooldown active, skipping:', transcript);
            continue;
          }
          
          // Check if this is the same message as before (but allow important commands)
          if (!isImportantCommand && transcript === this.lastUserMessage) {
            console.log('🎤 Same message as before, skipping:', transcript);
            continue;
          }
          
          // Check if we're waiting for user response (but allow important commands)
          // Allow all commands when waiting for user, don't skip short messages
          if (!isImportantCommand && this.isWaitingForUser && transcript.length < 3) {
            console.log('🎤 Waiting for user response, skipping very short message:', transcript);
            continue;
          }
          
          // Check for alternative results if primary is unclear
          if (result.length > 1) {
            console.log('🎤 Alternative transcripts:', result.map((r: any) => r.transcript));
            
            // Try to find a better match for common words
            const alternatives = result.map((r: any) => r.transcript.toLowerCase());
            const correctedTranscript = this.correctCommonWords(alternatives);
            
            if (correctedTranscript !== transcript) {
              console.log('🎤 Corrected transcript:', correctedTranscript);
              transcript = correctedTranscript;
            }
          }
          
          console.log('🎤 Processing command:', transcript);
          
          // Reset failure counter on successful recognition
          this.consecutiveFailures = 0;
          
          // Update last response time and user message
          this.lastResponseTime = currentTime;
          this.lastUserMessage = transcript;
          
          // Treat voice input EXACTLY like typing - no difference at all
          this.currentMessage = transcript;
          console.log('🎤 Setting message to:', this.currentMessage);
          
          // Add visual feedback that voice input was detected
          this.showVoiceInputFeedback(transcript);
          
          this.sendMessage(); // Same as typing
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('🎤 Speech recognition error:', event.error);
      this.isListening = false;
      this.consecutiveFailures++;
      
      // If too many consecutive failures, try to recover
      if (this.consecutiveFailures >= this.maxFailures) {
        console.log('🎤 Too many consecutive failures, attempting recovery...');
        this.consecutiveFailures = 0;
        this.shouldListenContinuously = false;
        setTimeout(() => {
          this.setupSpeechRecognition();
          this.shouldListenContinuously = true;
          this.startContinuousListening();
        }, 2000);
      } else {
        // Recreate recognition instance for next use
        setTimeout(() => {
          this.setupSpeechRecognition();
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      console.log('🎤 Speech recognition ended');
      this.isListening = false;
      // Only restart if we're supposed to be listening continuously AND in auto mode
      if (this.shouldListenContinuously && this.listeningMode === 'auto') {
        console.log('🎤 Restarting continuous listening...');
        setTimeout(() => {
          this.startContinuousListening();
        }, 500);
      } else {
        console.log('🎤 Not restarting - manual mode or shouldListenContinuously = false');
      }
    };
  }

  private initializeSpeechSynthesis() {
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      
      // Load voices when they become available
      if (this.synthesis.getVoices().length === 0) {
        this.synthesis.addEventListener('voiceschanged', () => {
          console.log('Voices loaded:', this.synthesis.getVoices());
        });
      }
    }
  }

  private addWelcomeMessage() {
    const welcomeMessage: Message = {
      id: this.generateId(),
      text: "Hello! I'm AISHA, your AI assistant. I'm always listening for your commands. I can help you navigate the application, open system applications, and assist with various tasks. Just speak naturally or type your message. I'll wait for your response after each message.",
      isUser: false,
      timestamp: new Date()
    };
    this.messages.push(welcomeMessage);
    this.setEmotion('happy', 0.7);
    this.isWaitingForUser = true; // Set initial waiting state
  }

  private startBlinkingAnimation() {
    setInterval(() => {
      if (!this.isGlowing) {
        this.isBlinking = true;
        setTimeout(() => {
          this.isBlinking = false;
        }, 200);
      }
    }, 3000 + Math.random() * 2000);
  }

  sendMessage() {
    if (!this.currentMessage.trim()) {
      console.log('❌ Empty message, not sending');
      return;
    }

    console.log('📤 SENDING MESSAGE (same for voice and typing):', {
      message: this.currentMessage,
      timestamp: new Date(),
      messageLength: this.currentMessage.length
    });

    const userMessage: Message = {
      id: this.generateId(),
      text: this.currentMessage,
      isUser: true,
      timestamp: new Date()
    };

    this.messages.push(userMessage);
    console.log('✅ Message added to chat. Total messages:', this.messages.length);
    
    this.currentMessage = '';
    this.scrollToBottom();

    // Simulate AI response
    console.log('🤖 Calling simulateAIResponse');
    this.simulateAIResponse();
  }

  private simulateAIResponse() {
    console.log('🤖 SIMULATE AI RESPONSE STARTED');
    this.isTyping = true;
    this.setEmotion('thinking', 0.8);
    this.isGlowing = true;

    setTimeout(() => {
      // Get the last user message
      const lastUserMessage = this.messages.filter(m => m.isUser).pop();
      const userText = lastUserMessage?.text.toLowerCase() || '';
      
      console.log('🔍 PROCESSING MESSAGE:', {
        lastUserMessage: lastUserMessage?.text,
        userText,
        messageCount: this.messages.length
      });

      let response = '';
      let actionExecuted = false;

      // Process command directly (same for voice and typing)
      console.log('📝 Processing command directly');
      console.log('🔍 Command received:', userText);
      
      // Check for greetings first
      const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', 'what\'s up'];
      const isGreeting = greetings.some(greeting => userText.toLowerCase().includes(greeting));
      
      if (isGreeting) {
        console.log('👋 Greeting detected:', userText);
        response = "Hello! How can I help you today?";
        this.isWaitingForUser = true; // Set waiting state
        console.log('💬 Greeting response:', response);
      } else {
        // Check for system commands
        const isCommand = this.isSystemCommand(userText);
        console.log('🔍 Is system command?', isCommand);
        
        if (isCommand) {
          console.log('⚡ Executing system command:', userText);
          response = this.executeSystemCommand(userText);
          actionExecuted = true;
          this.isWaitingForUser = false; // Reset waiting state for commands
          console.log('✅ System command executed. Response:', response);
        } else {
          // Generate AI response for ALL other queries
          console.log('🤖 Generating AI response for:', userText);
          response = this.generateAIResponse(userText);
          this.isWaitingForUser = true; // Set waiting state
        }
      }
      
      const aiMessage: Message = {
        id: this.generateId(),
        text: response,
        isUser: false,
        timestamp: new Date()
      };

      this.messages.push(aiMessage);
      this.isTyping = false;
      this.setEmotion(actionExecuted ? 'happy' : 'neutral', 0.6);
      this.scrollToBottom();

      // Start lip sync animation
      this.startLipSync(response);

      // Text-to-speech
      if (this.ttsEnabled) {
        this.speakText(response);
      }
    }, 1500 + Math.random() * 1000);
  }

  private speakText(text: string) {
    if (this.synthesis) {
      this.isSpeaking = true;
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Get available voices and select a female voice
      const voices = this.synthesis.getVoices();
      const femaleVoice = voices.find((voice: SpeechSynthesisVoice) => 
        voice.name.toLowerCase().includes('female') ||
        voice.name.toLowerCase().includes('woman') ||
        voice.name.toLowerCase().includes('girl') ||
        voice.name.toLowerCase().includes('zira') ||
        voice.name.toLowerCase().includes('susan') ||
        voice.name.toLowerCase().includes('karen') ||
        voice.name.toLowerCase().includes('samantha') ||
        voice.name.toLowerCase().includes('victoria') ||
        voice.name.toLowerCase().includes('hazel') ||
        voice.name.toLowerCase().includes('susan') ||
        (voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female'))
      );
      
      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      // Female voice settings
      utterance.rate = 0.85;
      utterance.pitch = 1.2;
      utterance.volume = 0.9;

      utterance.onend = () => {
        this.isSpeaking = false;
        this.stopLipSync();
      };

      this.synthesis.speak(utterance);
    }
  }

  toggleVoiceInput() {
    if (this.isListening) {
      this.stopContinuousListening();
    } else {
      this.startContinuousListening();
    }
  }

  startContinuousListening() {
    // Prevent multiple simultaneous start attempts
    if (this.isStarting || this.isListening) {
      console.log('🎤 Already starting or listening, skipping...');
      return;
    }

    this.isStarting = true;
    this.shouldListenContinuously = true;
    this.listeningMode = 'auto'; // Resume auto-restart when manually started

    if (!this.recognition) {
      console.log('🎤 Recognition not available, recreating...');
      this.setupSpeechRecognition();
    }

    try {
      this.recognition.start();
      this.isListening = true;
      this.isStarting = false;
      this.consecutiveFailures = 0; // Reset failure counter on successful start
      console.log('🎤 Started CONTINUOUS listening with improved reliability!');
    } catch (error) {
      console.error('Error starting continuous speech recognition:', error);
      this.isListening = false;
      this.isStarting = false;
      this.consecutiveFailures++;
      
      // Try to recreate recognition instance with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.consecutiveFailures), 5000);
      setTimeout(() => {
        this.setupSpeechRecognition();
        this.startContinuousListening();
      }, delay);
    }
  }

  stopContinuousListening() {
    this.shouldListenContinuously = false;
    this.isStarting = false;
    this.listeningMode = 'manual'; // Stop auto-restart when manually stopped
    
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      console.log('🎤 Stopped continuous listening');
    }
  }

  toggleTTS() {
    this.ttsEnabled = !this.ttsEnabled;
    if (this.ttsEnabled && this.synthesis) {
      this.synthesis.cancel();
    }
  }

  private setEmotion(type: AISHAEmotion['type'], intensity: number) {
    this.currentEmotion = { type, intensity };
    
    // Update avatar animation based on emotion
    switch (type) {
      case 'happy':
        this.avatarAnimation = 'happy';
        break;
      case 'sad':
        this.avatarAnimation = 'sad';
        break;
      case 'thinking':
        this.avatarAnimation = 'thinking';
        break;
      case 'excited':
        this.avatarAnimation = 'excited';
        break;
      default:
        this.avatarAnimation = 'idle';
    }
  }

  private startLipSyncAnimation() {
    this.lipSyncInterval = setInterval(() => {
      if (!this.isSpeaking) {
        this.currentLipShape = 'neutral';
      }
    }, 100);
  }

  private startLipSync(text: string) {
    this.isSpeaking = true;
    const words = text.toLowerCase().split(' ');
    let wordIndex = 0;

    const speakInterval = setInterval(() => {
      if (wordIndex < words.length) {
        this.currentLipShape = this.getLipShapeForWord(words[wordIndex]);
        wordIndex++;
      } else {
        clearInterval(speakInterval);
        setTimeout(() => {
          this.stopLipSync();
        }, 500);
      }
    }, 200);
  }

  private stopLipSync() {
    this.isSpeaking = false;
    this.currentLipShape = 'neutral';
  }

  private getLipShapeForWord(word: string): string {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const firstVowel = word.split('').find(char => vowels.includes(char));
    
    switch (firstVowel) {
      case 'a': return 'open';
      case 'e': return 'smile';
      case 'i': return 'narrow';
      case 'o': return 'round';
      case 'u': return 'pucker';
      default: return 'neutral';
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.chatContainer) {
        this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
      }
    }, 100);
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }
  }

  testVoiceCommand() {
    console.log('🔴 RED BUTTON TEST: Testing voice command simulation...');
    this.currentMessage = 'open notepad';
    console.log('🔴 Setting message to:', this.currentMessage);
    this.sendMessage();
  }

  testSimpleCommand() {
    console.log('🟢 GREEN BUTTON TEST: Testing simple command...');
    this.currentMessage = 'open notepad';
    console.log('🟢 Setting message to:', this.currentMessage);
    this.sendMessage();
  }

  clearChat() {
    this.messages = [];
    this.addWelcomeMessage();
    this.setEmotion('neutral', 0.5);
  }

  openSettings() {
    console.log('Settings clicked');
  }

  // Removed layout methods for standalone page

  // System Command Detection and Execution
  private isSystemCommand(text: string): boolean {
    // Check for greetings first - these are NOT system commands
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'how are you', 'what\'s up'];
    const isGreeting = greetings.some(greeting => text.toLowerCase().includes(greeting));
    
    if (isGreeting) {
      console.log('Greeting detected:', text);
      return false; // Greetings are not system commands
    }
    
    const commandKeywords = [
      'open', 'click', 'press', 'launch', 'start', 'run', 'execute',
      'folder', 'file', 'application', 'app', 'program', 'browser',
      'notepad', 'calculator', 'explorer', 'cmd', 'terminal', 'powershell',
      'button', 'ok', 'yes', 'no', 'cancel', 'save', 'close', 'submit',
      'delete', 'edit', 'add', 'create', 'confirm', 'stop', 'pause', 'halt'
    ];
    
    const isCommand = commandKeywords.some(keyword => text.includes(keyword));
    console.log('System command detection:', { text, isCommand, keywords: commandKeywords.filter(k => text.includes(k)) });
    
    return isCommand;
  }

  private executeSystemCommand(text: string): string {
    try {
      console.log('Executing system command:', text);
      
      // Open commands
      if (text.includes('open') || text.includes('launch') || text.includes('start')) {
        return this.handleOpenCommand(text);
      }
      
      // Click commands
      if (text.includes('click') || text.includes('press') || text.includes('button')) {
        return this.handleClickCommand(text);
      }
      
      // Stop commands
      if (text.includes('stop') || text.includes('pause') || text.includes('halt')) {
        return this.handleStopCommand(text);
      }
      
      // Default system response
      return "I understand you want me to perform a system action. Please be more specific about what you'd like me to open or click.";
      
    } catch (error: any) {
      console.error('Error executing system command:', error);
      return "I encountered an error while trying to execute your command. Please try again.";
    }
  }

  private handleOpenCommand(text: string): string {
    // Browser commands
    if (text.includes('browser') || text.includes('chrome') || text.includes('firefox') || text.includes('edge')) {
      this.performSystemAction('browser');
      return "Opening your default browser...";
    }
    
    // Notepad
    if (text.includes('notepad')) {
      this.openNotepad();
      return "Opening Notepad...";
    }
    
    // Calculator
    if (text.includes('calculator')) {
      this.openCalculator();
      return "Opening Calculator...";
    }
    
    // File Explorer
    if (text.includes('explorer') || text.includes('folder')) {
      this.openExplorer();
      return "Opening File Explorer...";
    }
    
    // Command Prompt
    if (text.includes('cmd') || text.includes('command') || text.includes('terminal')) {
      this.openCommandPrompt();
      return "Opening Command Prompt...";
    }
    
    // PowerShell
    if (text.includes('powershell')) {
      this.openPowerShell();
      return "Opening PowerShell...";
    }
    
    // Task Manager
    if (text.includes('task') && text.includes('manager')) {
      this.openTaskManager();
      return "Opening Task Manager...";
    }
    
    return "I can open: notepad, calculator, explorer, cmd, powershell, browser, or task manager. What would you like me to open?";
  }

  private handleClickCommand(text: string): string {
    // Navigation commands - Support all sidebar components
    if (text.includes('clothaura') || text.includes('cloth aura') || text.includes('laundry')) {
      this.navigateToClothAura();
      return "Navigating to ClothAura...";
    }
    
    if (text.includes('dashboard') && !text.includes('lic')) {
      this.navigateToDashboard();
      return "Navigating to Dashboard...";
    }
    
    if (text.includes('customers')) {
      this.navigateToCustomers();
      return "Navigating to Customers...";
    }
    
    if (text.includes('deposits')) {
      this.navigateToDeposits();
      return "Navigating to Deposits...";
    }
    
    if (text.includes('reports')) {
      this.navigateToReports();
      return "Navigating to Reports...";
    }
    
    if (text.includes('users') || text.includes('user management')) {
      this.navigateToUsers();
      return "Navigating to User Management...";
    }
    
    if (text.includes('policies')) {
      this.navigateToPolicies();
      return "Navigating to Policies...";
    }
    
    if (text.includes('emi calculator') || text.includes('emi') || (text.includes('calculator') && !text.includes('lic'))) {
      this.navigateToCalculator();
      return "Navigating to EMI Calculator...";
    }
    
    // LIC Components
    if (text.includes('lic dashboard') || (text.includes('lic') && text.includes('dashboard'))) {
      this.navigateToLicDashboard();
      return "Navigating to LIC Dashboard...";
    }
    
    if (text.includes('lic products') || text.includes('product details') || (text.includes('lic') && text.includes('products'))) {
      this.navigateToLicProducts();
      return "Navigating to LIC Products...";
    }
    
    if (text.includes('lic calculator') || text.includes('premium calculator') || (text.includes('lic') && text.includes('calculator'))) {
      this.navigateToLicCalculator();
      return "Navigating to LIC Premium Calculator...";
    }
    
    // AISHA component
    if (text.includes('aisha')) {
      this.navigateToAISHA();
      return "Navigating to AISHA...";
    }
    
    return "I can navigate to: Dashboard, LIC Dashboard, LIC Products, LIC Premium Calculator, Customers, Deposits, Policies, EMI Calculator, ClothAura, Reports, User Management, or AISHA. What would you like me to click?";
  }

  private handleStopCommand(text: string): string {
    console.log('🛑 STOP COMMAND DETECTED:', text);
    
    // Stop voice recognition
    if (this.isListening) {
      this.stopContinuousListening();
      console.log('🛑 Voice recognition stopped');
    }
    
    // Stop text-to-speech
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      this.stopLipSync();
      console.log('🛑 Text-to-speech stopped');
    }
    
    // Stop any ongoing animations
    this.isGlowing = false;
    this.isBlinking = false;
    this.isTyping = false;
    
    // Reset emotion to neutral
    this.setEmotion('neutral', 0.5);
    
    console.log('🛑 All AISHA activities stopped');
    return "🛑 All activities stopped. I'm now in standby mode. Say 'hello' or give me a command to reactivate.";
  }

  private async performSystemAction(action: string) {
    try {
      // Map action to backend expected format
      let type = '';
      switch (action) {
        case 'notepad':
          type = 'open_notepad';
          break;
        case 'calculator':
          type = 'open_calculator';
          break;
        case 'explorer':
          type = 'open_explorer';
          break;
        case 'cmd':
          type = 'open_cmd';
          break;
        case 'powershell':
          type = 'open_powershell';
          break;
        case 'browser':
          type = 'open_browser';
          break;
        case 'task_manager':
          type = 'open_task_manager';
          break;
        default:
          type = action;
      }

      const response = await fetch('http://localhost:8080/system-commands/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          command: action,
          type: type,
          target: action
        })
      });
      
      const result = await response.json();
      console.log('System action result:', result);
    } catch (error: any) {
      console.error('Error executing system action:', error);
    }
  }

  private openNotepad(): void {
    try {
      this.performSystemAction('notepad');
    } catch (error: any) {
      console.error('Error opening notepad:', error);
    }
  }

  private openCalculator(): void {
    try {
      this.performSystemAction('calculator');
    } catch (error: any) {
      console.error('Error opening calculator:', error);
    }
  }

  private openExplorer(): void {
    try {
      this.performSystemAction('explorer');
    } catch (error: any) {
      console.error('Error opening explorer:', error);
    }
  }

  private openCommandPrompt(): void {
    try {
      this.performSystemAction('cmd');
    } catch (error: any) {
      console.error('Error opening command prompt:', error);
    }
  }

  private openPowerShell(): void {
    try {
      this.performSystemAction('powershell');
    } catch (error: any) {
      console.error('Error opening powershell:', error);
    }
  }

  private openTaskManager(): void {
    try {
      this.performSystemAction('task_manager');
    } catch (error: any) {
      console.error('Error opening task manager:', error);
    }
  }

  // Navigation Methods
  private navigateToClothAura(): void {
    try {
      window.location.href = '/laundry';
    } catch (error: any) {
      console.error('Error navigating to ClothAura:', error);
    }
  }

  private navigateToDashboard(): void {
    try {
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error('Error navigating to Dashboard:', error);
    }
  }

  private navigateToCustomers(): void {
    try {
      window.location.href = '/customers';
    } catch (error: any) {
      console.error('Error navigating to Customers:', error);
    }
  }

  private navigateToDeposits(): void {
    try {
      window.location.href = '/deposits';
    } catch (error: any) {
      console.error('Error navigating to Deposits:', error);
    }
  }

  private navigateToReports(): void {
    try {
      window.location.href = '/reports';
    } catch (error: any) {
      console.error('Error navigating to Reports:', error);
    }
  }

  private navigateToUsers(): void {
    try {
      window.location.href = '/users';
    } catch (error: any) {
      console.error('Error navigating to Users:', error);
    }
  }

  private navigateToPolicies(): void {
    try {
      window.location.href = '/policies';
    } catch (error: any) {
      console.error('Error navigating to Policies:', error);
    }
  }

  private navigateToCalculator(): void {
    try {
      window.location.href = '/calculator';
    } catch (error: any) {
      console.error('Error navigating to Calculator:', error);
    }
  }

  private navigateToLicDashboard(): void {
    try {
      window.location.href = '/lic-dashboard';
    } catch (error: any) {
      console.error('Error navigating to LIC Dashboard:', error);
    }
  }

  private navigateToLicProducts(): void {
    try {
      window.location.href = '/lic-products';
    } catch (error: any) {
      console.error('Error navigating to LIC Products:', error);
    }
  }

  private navigateToLicCalculator(): void {
    try {
      window.location.href = '/lic-premium-calculator';
    } catch (error: any) {
      console.error('Error navigating to LIC Calculator:', error);
    }
  }

  private navigateToAISHA(): void {
    try {
      window.location.href = '/aisha';
    } catch (error: any) {
      console.error('Error navigating to AISHA:', error);
    }
  }

  private correctCommonWords(alternatives: string[]): string {
    // Common word corrections for better recognition - All sidebar components
    const wordCorrections: { [key: string]: string[] } = {
      'aisha': ['isha', 'aisha', 'aisha', 'aisha', 'aisha'],
      'clothaura': ['cloth aura', 'cloth ora', 'cloth aura', 'clot aura', 'cloth or a', 'cloth or', 'laundry'],
      'dashboard': ['dash board', 'dash bored', 'dash board', 'dashboard'],
      'lic dashboard': ['lic dash board', 'lic dash bored', 'lic dashboard', 'lic dash board'],
      'customers': ['customer', 'customers', 'customer s', 'customers'],
      'deposits': ['deposit', 'deposits', 'deposit s', 'deposits'],
      'reports': ['report', 'reports', 'report s', 'reports'],
      'users': ['user', 'users', 'user s', 'users', 'user management'],
      'policies': ['policy', 'policies', 'policy s', 'policies'],
      'emi calculator': ['emi calculate', 'emi calculator', 'emi calculate or', 'emi calculator'],
      'calculator': ['calculate', 'calculator', 'calculate or', 'calculator'],
      'lic products': ['lic product', 'lic products', 'lic product s', 'lic products', 'product details'],
      'lic calculator': ['lic calculate', 'lic calculator', 'lic calculate or', 'lic calculator', 'premium calculator'],
      'notepad': ['note pad', 'note pad', 'notepad', 'note pad'],
      'browser': ['browse', 'browser', 'browse or', 'browser'],
      'explorer': ['explore', 'explorer', 'explore or', 'explorer'],
      'terminal': ['term', 'terminal', 'term in all', 'terminal'],
      'powershell': ['power shell', 'powershell', 'power shell', 'powershell'],
      'stop': ['stop', 'stopp', 'stop', 'stop', 'halt', 'pause']
    };

    // Find the best match from alternatives
    for (const alternative of alternatives) {
      for (const [correctWord, variations] of Object.entries(wordCorrections)) {
        for (const variation of variations) {
          if (alternative.includes(variation) || alternative === variation) {
            console.log(`🎯 Word correction: "${alternative}" → "${correctWord}"`);
            return alternative.replace(variation, correctWord);
          }
        }
      }
    }

    return alternatives[0]; // Return the first alternative if no correction found
  }

  private isImportantCommand(transcript: string): boolean {
    const importantCommands = [
      'stop', 'halt', 'pause', 'quit', 'exit',
      'help', 'hello', 'hi', 'hey',
      'open', 'click', 'go to', 'navigate', 'navigate to',
      'dashboard', 'customers', 'deposits', 'loans', 'policies',
      'clothaura', 'laundry', 'lic', 'aisha', 'user', 'users',
      'calculator', 'notepad', 'browser', 'explorer', 'cmd', 'terminal'
    ];
    
    return importantCommands.some(cmd => 
      transcript.includes(cmd) || transcript.startsWith(cmd)
    );
  }

  private showVoiceInputFeedback(transcript: string) {
    // Add a temporary visual indicator that voice input was detected
    console.log('🎤 Voice input detected and typed:', transcript);
    
    // You could add a toast notification or visual indicator here
    // For now, we'll just log it and the textarea will show the text
  }

  private generateAIResponse(query: string): string {
    console.log('🤖 Generating AI response for query:', query);
    
    // Simple AI responses based on query content
    const lowerQuery = query.toLowerCase();
    
    // Weather related
    if (lowerQuery.includes('weather') || lowerQuery.includes('rain') || lowerQuery.includes('sunny')) {
      return "I don't have access to real-time weather data, but I can help you with other tasks!";
    }
    
    // Time related
    if (lowerQuery.includes('time') || lowerQuery.includes('clock')) {
      const now = new Date();
      return `The current time is ${now.toLocaleTimeString()}. How else can I help you?`;
    }
    
    // Calculator
    if (lowerQuery.includes('calculate') || lowerQuery.includes('math') || lowerQuery.includes('+') || lowerQuery.includes('-') || lowerQuery.includes('*') || lowerQuery.includes('/')) {
      return "I can help with basic calculations! Try saying something like 'calculate 5 plus 3' or 'what is 10 times 2'.";
    }
    
    // Help
    if (lowerQuery.includes('help') || lowerQuery.includes('assist')) {
      return "I'm here to help! I can navigate the application, open system programs, answer questions, and assist with various tasks. What would you like me to do?";
    }
    
    // Self introduction
    if (lowerQuery.includes('who are you') || lowerQuery.includes('what are you') || lowerQuery.includes('aisha')) {
      return "I'm AISHA, your AI assistant! I can help you navigate the application, open programs, answer questions, and assist with various tasks. How can I help you today?";
    }
    
    // Thanks
    if (lowerQuery.includes('thank') || lowerQuery.includes('thanks')) {
      return "You're welcome! I'm always here to help. Is there anything else you need?";
    }
    
    // Goodbye
    if (lowerQuery.includes('bye') || lowerQuery.includes('goodbye') || lowerQuery.includes('see you')) {
      return "Goodbye! Feel free to come back anytime. I'll be here when you need me!";
    }
    
    // Application specific
    if (lowerQuery.includes('customer') || lowerQuery.includes('deposit') || lowerQuery.includes('loan') || lowerQuery.includes('policy')) {
      return "I can help you navigate to the " + (lowerQuery.includes('customer') ? 'customers' : 
             lowerQuery.includes('deposit') ? 'deposits' : 
             lowerQuery.includes('loan') ? 'loans' : 'policies') + " section. Would you like me to take you there?";
    }
    
    // Default responses
    const defaultResponses = [
      "I understand! How can I help you with that?",
      "I'm here to assist you. What would you like me to do?",
      "Sure! What specific action do you need?",
      "I'm ready to help. Please provide more details.",
      "I'm listening. What can I do for you?",
      "Yes, I'm here. What would you like me to do?",
      "Tell me more about what you need help with.",
      "I'm ready to assist. What's your request?",
      "That's interesting! How can I help you with that?",
      "I'm here to help. What would you like to know?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  }


  ngOnDestroy() {
    this.shouldListenContinuously = false;
    this.isStarting = false;
    
    // Clean up navigation subscription
    if (this.navigationSubscription) {
      this.navigationSubscription.unsubscribe();
    }
    
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
  
  public refreshSessionData() {
    const oldRole = this.userRole;
    this.userRole = sessionStorage.getItem('role') || '';
    console.log('🔄 AISHA session refresh:', { oldRole, newRole: this.userRole });
    
    // If role changed (logout/login), reset AISHA state
    if (oldRole !== this.userRole) {
      console.log('👤 User role changed, resetting AISHA state');
      this.resetAISHAState();
    }
  }
  
  public refreshAISHAOnLogin() {
    console.log('🔐 User logged in, refreshing AISHA');
    this.refreshSessionData();
  }
  
  private setupNavigationListener() {
    // Listen for navigation events to refresh session data
    this.navigationSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        console.log('🧭 Navigation detected, refreshing session data:', event.url);
        this.refreshSessionData();
      });
  }
  
  private resetAISHAState() {
    console.log('🔄 Resetting AISHA state after role change');
    
    // Clear messages except the first welcome message
    if (this.messages.length > 0) {
      const welcomeMsg = this.messages[0];
      this.messages = [welcomeMsg];
    }
    
    // Reset speech recognition state
    this.lastResponseTime = 0;
    this.lastUserMessage = '';
    this.isWaitingForUser = false;
    this.consecutiveFailures = 0;
    
    // Restart listening if needed
    if (this.shouldListenContinuously) {
      setTimeout(() => {
        this.startContinuousListening();
      }, 500);
    }
  }
}