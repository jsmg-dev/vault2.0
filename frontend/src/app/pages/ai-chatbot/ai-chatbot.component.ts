import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface ChatMessage {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

interface PolicyInfo {
  name: string;
  category: string;
  type: string;
  description: string;
  minAge: number;
  maxAge: number;
  minTerm: number;
  maxTerm: number;
  minSumAssured: number;
  maxSumAssured: number;
  features: string[];
  benefits: string;
  premiumInfo: string;
}

@Component({
  selector: 'app-ai-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ai-chatbot.component.html',
  styleUrl: './ai-chatbot.component.css'
})
export class AiChatbotComponent implements OnInit, OnDestroy {
  messages: ChatMessage[] = [];
  userInput: string = '';
  isTyping: boolean = false;
  isMinimized: boolean = true; // Start minimized by default
  isDragging: boolean = false;
  position = { x: 20, y: 20 }; // Default position (bottom-right)
  dragOffset = { x: 0, y: 0 };
  showChatbot: boolean = false;
  private previousPosition = { x: 0, y: 0 }; // Store previous position
  private routeSubscription: Subscription = new Subscription();

  constructor(private router: Router) {}

  // LIC Policy Knowledge Base - Comprehensive Database
  private policyDatabase: PolicyInfo[] = [
    // New Products (Featured)
    {
      name: 'New Tech Term',
      category: 'Term Insurance',
      type: 'New Product',
      description: 'Choose between Level Sum Assured and Increasing Sum Assured with flexible premium options.',
      minAge: 18,
      maxAge: 65,
      minTerm: 5,
      maxTerm: 40,
      minSumAssured: 100000,
      maxSumAssured: 25000000,
      features: ['Level or Increasing Sum Assured', 'Flexible premium options', 'Single/Regular/Limited premium', 'Flexible policy term', 'Benefit in instalments option'],
      benefits: 'Sum Assured on Maturity + Vested Bonus',
      premiumInfo: 'Premium starts from ₹5,000 per year'
    },
    {
      name: 'Jeevan Utsav',
      category: 'Endowment Plan',
      type: 'New Product',
      description: 'Guaranteed annual payout of 10% of Sum Assured starts 3-6 years after premium payment term.',
      minAge: 18,
      maxAge: 65,
      minTerm: 10,
      maxTerm: 25,
      minSumAssured: 200000,
      maxSumAssured: 10000000,
      features: ['10% guaranteed annual payout', 'Lifelong financial security', 'Guaranteed additions', 'Whole life insurance', 'Limited premium payment term'],
      benefits: 'Sum Assured + Guaranteed Additions',
      premiumInfo: 'Premium starts from ₹12,000 per year'
    },
    {
      name: 'Amritbal',
      category: 'Child Plan',
      type: 'New Product',
      description: 'Attractive guaranteed additions offered throughout the policy term for consistent growth.',
      minAge: 0,
      maxAge: 12,
      minTerm: 15,
      maxTerm: 20,
      minSumAssured: 100000,
      maxSumAssured: 5000000,
      features: ['Attractive guaranteed additions', 'Consistent growth', 'Maturity age 18-25 years', 'Single/Limited premium payment', 'Child future planning'],
      benefits: 'Sum Assured + Guaranteed Additions',
      premiumInfo: 'Premium starts from ₹6,000 per year'
    },
    {
      name: 'Digi Term',
      category: 'Term Insurance',
      type: 'New Product',
      description: 'Flexibility to choose Level Sum Assured / Increasing Sum Assured with benefit of Attractive High Sum Assured Rebate.',
      minAge: 18,
      maxAge: 65,
      minTerm: 5,
      maxTerm: 40,
      minSumAssured: 100000,
      maxSumAssured: 25000000,
      features: ['Level/Increasing Sum Assured', 'High Sum Assured Rebate', 'Digital purchase process', 'Flexible premium options', 'Online policy management'],
      benefits: 'Sum Assured on Death',
      premiumInfo: 'Premium starts from ₹5,000 per year'
    },
    {
      name: 'Cancer Cover',
      category: 'Health Insurance',
      type: 'Health Insurance',
      description: 'Regular Premium, Non-linked, Non-participating Health Insurance plan offering financial protection for cancer diagnosis.',
      minAge: 18,
      maxAge: 65,
      minTerm: 10,
      maxTerm: 25,
      minSumAssured: 100000,
      maxSumAssured: 5000000,
      features: ['Regular premium plan', 'Non-linked, Non-participating', 'Early & Major stage cancer cover', 'Financial protection', 'Health insurance coverage'],
      benefits: 'Sum Assured for Cancer Treatment',
      premiumInfo: 'Premium starts from ₹8,000 per year'
    },
    {
      name: 'Index Plus',
      category: 'Unit Linked Plan',
      type: 'Unit Linked',
      description: 'Monthly premiums start as low as ₹2500/-, offering affordability with choice of two funds.',
      minAge: 18,
      maxAge: 65,
      minTerm: 10,
      maxTerm: 25,
      minSumAssured: 100000,
      maxSumAssured: 10000000,
      features: ['Low premium starting ₹2500/month', 'Two fund options', 'Up to 100% NIFTY 50 stocks', 'Guaranteed additions', 'Policy value enhancement'],
      benefits: 'Market-linked returns + Life Cover',
      premiumInfo: 'Premium starts from ₹30,000 per year'
    },
    {
      name: 'New Jeevan Shanti',
      category: 'Pension Plan',
      type: 'Pension Plan',
      description: 'Single premium plan offering choice between Single Life and Joint Life Deferred annuity with guaranteed rates.',
      minAge: 18,
      maxAge: 75,
      minTerm: 10,
      maxTerm: 20,
      minSumAssured: 100000,
      maxSumAssured: 50000000,
      features: ['Single premium plan', 'Single/Joint Life Deferred annuity', 'Guaranteed rates from start', 'Lifetime payments', 'Deferment period option'],
      benefits: 'Lifetime Annuity Payments',
      premiumInfo: 'Single premium starts from ₹1,50,000'
    },
    {
      name: 'Jeevan Akshay - VII',
      category: 'Pension Plan',
      type: 'Immediate Annuity',
      description: 'Immediate Annuity plan allowing choice from 10 annuity options by paying lump sum amount.',
      minAge: 30,
      maxAge: 80,
      minTerm: 10,
      maxTerm: 30,
      minSumAssured: 100000,
      maxSumAssured: 50000000,
      features: ['Immediate annuity plan', '10 annuity options', 'Lump sum payment', 'Guaranteed rates from start', 'Lifetime payments'],
      benefits: 'Immediate Annuity Payments',
      premiumInfo: 'Lump sum starts from ₹1,00,000'
    },
    {
      name: 'Jeevan Anand',
      category: 'Endowment Plan',
      type: 'Endowment Plan',
      description: 'A combination of Endowment Assurance and Whole Life plan providing financial protection and savings.',
      minAge: 18,
      maxAge: 60,
      minTerm: 15,
      maxTerm: 35,
      minSumAssured: 100000,
      maxSumAssured: 50000000,
      features: ['Endowment + Whole Life', 'Maturity benefit', 'Death benefit', 'Bonus participation', 'Loan facility available'],
      benefits: 'Sum Assured + Bonus (Maturity & Death)',
      premiumInfo: 'Premium starts from ₹8,000 per year'
    },
    {
      name: 'Jeevan Labh',
      category: 'Endowment Plan',
      type: 'Limited Premium',
      description: 'A limited premium paying endowment plan with high returns and bonus benefits.',
      minAge: 18,
      maxAge: 55,
      minTerm: 16,
      maxTerm: 25,
      minSumAssured: 200000,
      maxSumAssured: 25000000,
      features: ['Limited premium payment', 'High returns', 'Bonus benefits', 'Maturity benefit', 'Death benefit'],
      benefits: 'Sum Assured + Bonus',
      premiumInfo: 'Premium starts from ₹12,000 per year'
    },
    {
      name: 'Jeevan Umang',
      category: 'Money Back Plan',
      type: 'Money Back Plan',
      description: 'A money back plan with survival benefits payable at regular intervals and maturity benefit.',
      minAge: 18,
      maxAge: 55,
      minTerm: 15,
      maxTerm: 25,
      minSumAssured: 200000,
      maxSumAssured: 25000000,
      features: ['Regular survival benefits', 'Maturity benefit', 'Death benefit', 'Bonus participation', 'Loan facility'],
      benefits: 'Survival Benefits + Maturity + Death Benefit',
      premiumInfo: 'Premium starts from ₹15,000 per year'
    },
    {
      name: 'Jeevan Amrit',
      category: 'Term Insurance',
      type: 'Term Plan',
      description: 'Pure term insurance plan providing high coverage at low premium.',
      minAge: 18,
      maxAge: 65,
      minTerm: 10,
      maxTerm: 35,
      minSumAssured: 500000,
      maxSumAssured: 50000000,
      features: ['High coverage', 'Low premium', 'Pure protection', 'Flexible term', 'Online purchase'],
      benefits: 'Sum Assured on Death',
      premiumInfo: 'Premium starts from ₹3,000 per year'
    },
    {
      name: 'Jeevan Tarun',
      category: 'Whole Life Plan',
      type: 'Whole Life Plan',
      description: 'Whole life plan with limited premium payment providing lifelong coverage.',
      minAge: 18,
      maxAge: 65,
      minTerm: 15,
      maxTerm: 20,
      minSumAssured: 100000,
      maxSumAssured: 10000000,
      features: ['Limited premium payment', 'Lifelong coverage', 'Maturity benefit', 'Death benefit', 'Bonus participation'],
      benefits: 'Sum Assured + Vested Bonus',
      premiumInfo: 'Premium starts from ₹8,000 per year'
    },
    {
      name: 'Jeevan Unicorn',
      category: 'Unit Linked Plan',
      type: 'Unit Linked Plan',
      description: 'Unit linked insurance plan with investment options and market-linked returns.',
      minAge: 18,
      maxAge: 60,
      minTerm: 10,
      maxTerm: 25,
      minSumAssured: 100000,
      maxSumAssured: 10000000,
      features: ['Investment options', 'Market-linked returns', 'Flexible premium', 'Switching facility', 'Partial withdrawal'],
      benefits: 'Market-linked returns + Life Cover',
      premiumInfo: 'Premium starts from ₹25,000 per year'
    },
    {
      name: 'Aadhaar Stambh',
      category: 'Micro Insurance',
      type: 'Micro Insurance',
      description: 'Micro insurance plan for people in rural areas with low premium and simple terms.',
      minAge: 18,
      maxAge: 60,
      minTerm: 10,
      maxTerm: 20,
      minSumAssured: 75000,
      maxSumAssured: 200000,
      features: ['Low premium', 'Simple terms', 'Rural focus', 'Basic protection', 'Easy enrollment'],
      benefits: 'Sum Assured on Death',
      premiumInfo: 'Premium starts from ₹1,500 per year'
    },
    {
      name: 'Aadhaar Shila',
      category: 'Micro Insurance',
      type: 'Micro Insurance',
      description: 'Micro insurance plan providing basic life cover with low premium for economically weaker sections.',
      minAge: 18,
      maxAge: 60,
      minTerm: 10,
      maxTerm: 20,
      minSumAssured: 30000,
      maxSumAssured: 200000,
      features: ['Very low premium', 'Basic life cover', 'Economically weaker sections', 'Simple documentation', 'Government support'],
      benefits: 'Sum Assured on Death',
      premiumInfo: 'Premium starts from ₹500 per year'
    }
  ];


  addWelcomeMessage() {
    const welcomeMessage: ChatMessage = {
      id: 1,
      content: `👋 Hello! I'm **Agent JS**, your LIC Policy Assistant! 

I can help you with:
• 📋 List all LIC policies
• 🔍 Get details about specific policies
• 💡 Compare different policy types
• ❓ Answer policy-related questions

How can I assist you today?`,
      isUser: false,
      timestamp: new Date()
    };
    this.messages.push(welcomeMessage);
    
    // Debug: Log policy database info on welcome
    console.log('Welcome message added. Policy database info:');
    console.log('Total policies:', this.policyDatabase.length);
    console.log('Policy names:', this.policyDatabase.map(p => p.name));
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now(),
      content: this.userInput,
      isUser: true,
      timestamp: new Date()
    };
    this.messages.push(userMessage);

    const query = this.userInput.toLowerCase();
    this.userInput = '';

    // Show typing indicator
    this.showTypingIndicator();

    // Process the query after a short delay
    setTimeout(() => {
      this.processQuery(query);
    }, 1000);
  }

  showTypingIndicator() {
    const typingMessage: ChatMessage = {
      id: Date.now() + 1,
      content: 'Agent JS is typing...',
      isUser: false,
      timestamp: new Date(),
      isTyping: true
    };
    this.messages.push(typingMessage);
  }

  processQuery(query: string) {
    // Remove typing indicator
    this.messages = this.messages.filter(msg => !msg.isTyping);

    let response = '';

    // Debug logging
    console.log('Processing query:', query);
    console.log('isPolicyNameQuery:', this.isPolicyNameQuery(query));
    console.log('isDirectPolicyQuery:', this.isDirectPolicyQuery(query));
    console.log('Query includes list:', query.includes('list'));
    console.log('Query includes all:', query.includes('all'));
    console.log('Query includes policies:', query.includes('policies'));
    console.log('Query includes show:', query.includes('show'));

    // Handle different types of queries - PRIORITIZE policy detection
    if (query.includes('list') || query.includes('all') || query.includes('policies') || query.includes('show')) {
      console.log('Routing to policy list');
      response = this.getPolicyList();
    } else if (this.isDirectPolicyQuery(query) || this.isPolicyNameQuery(query)) {
      console.log('Routing to policy details');
      response = this.getPolicyDetails(query);
    } else if (query.includes('detail') || query.includes('information') || query.includes('about') || 
               query.includes('tell me') || query.includes('explain')) {
      response = this.getPolicyDetails(query);
    } else if (query.includes('compare') || query.includes('difference')) {
      response = this.comparePolicies(query);
    } else if (query.includes('premium') || query.includes('cost') || query.includes('price')) {
      response = this.getPremiumInfo(query);
    } else if (query.includes('benefit') || query.includes('advantage') || query.includes('feature')) {
      response = this.getBenefitsInfo(query);
    } else if (query.includes('age') || query.includes('eligibility') || query.includes('qualify')) {
      response = this.getEligibilityInfo(query);
    } else if (query.includes('help') || query.includes('support')) {
      response = this.getHelpMessage();
    } else {
      response = this.getGeneralResponse(query);
    }

    // Add bot response
    const botMessage: ChatMessage = {
      id: Date.now(),
      content: response,
      isUser: false,
      timestamp: new Date()
    };
    this.messages.push(botMessage);

    // Scroll to bottom
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }

  getPolicyList(): string {
    console.log('getPolicyList called');
    console.log('Policy database length:', this.policyDatabase.length);
    console.log('Policy names:', this.policyDatabase.map(p => p.name));
    
    let response = '📋 **Here are all the LIC policies I can help you with:**\n\n';
    
    try {
      this.policyDatabase.forEach((policy, index) => {
        console.log(`Processing policy ${index + 1}: ${policy.name}`);
        response += `${index + 1}. **${policy.name}** (${policy.category})\n`;
        response += `   - ${policy.description}\n`;
        response += `   - Premium: ${policy.premiumInfo}\n\n`;
      });
    } catch (error) {
      console.error('Error processing policies:', error);
      response += 'Error occurred while processing policies.';
    }

    response += '💡 **Tip:** Ask me "Tell me about [Policy Name]" to get detailed information about any specific policy!';
    
    console.log('Generated response length:', response.length);
    console.log('Full response:', response);
    return response;
  }

  getPolicyDetails(query: string): string {
    console.log('getPolicyDetails called with:', query);
    
    // Try multiple matching strategies
    let policy = this.findPolicyByDirectMatch(query);
    console.log('Direct match result:', policy?.name || 'None');
    
    if (!policy) {
      policy = this.findPolicyByKeyword(query);
      console.log('Keyword match result:', policy?.name || 'None');
    }
    
    if (!policy) {
      policy = this.findPolicyByPartialMatch(query);
      console.log('Partial match result:', policy?.name || 'None');
    }

    // Debug logging (can be removed later)
    console.log('Final policy found:', policy?.name || 'None');

    if (policy) {
      return `🔍 **Detailed Information about ${policy.name}:**\n\n
📋 **Basic Info:**
• Category: ${policy.category}
• Type: ${policy.type}
• Description: ${policy.description}

👥 **Eligibility:**
• Entry Age: ${policy.minAge} - ${policy.maxAge} years
• Policy Term: ${policy.minTerm} - ${policy.maxTerm} years
• Sum Assured: ₹${(policy.minSumAssured/100000).toFixed(0)} Lakhs - ₹${(policy.maxSumAssured/100000).toFixed(0)} Lakhs

💰 **Premium & Benefits:**
• ${policy.premiumInfo}
• Benefits: ${policy.benefits}

🚀 **Key Features:**
${policy.features.map((feature: string) => `• ${feature}`).join('\n')}

💡 **Need more specific information? Just ask!**`;
    }

    return `❓ I couldn't find details for that policy. Here are the available policies:

${this.policyDatabase.map(p => `• ${p.name}`).join('\n')}

Try asking: "Tell me about [Policy Name]"`;
  }

  private findPolicyByDirectMatch(query: string): PolicyInfo | null {
    const queryLower = query.toLowerCase().trim();
    
    // Direct name matching
    return this.policyDatabase.find(policy => 
      policy.name.toLowerCase() === queryLower ||
      policy.name.toLowerCase().includes(queryLower) ||
      queryLower.includes(policy.name.toLowerCase())
    ) || null;
  }

  private findPolicyByKeyword(query: string): PolicyInfo | null {
    const queryLower = query.toLowerCase();
    
    // Keyword mapping
    const keywordMap: { [key: string]: string } = {
      'tech term': 'New Tech Term',
      'tech': 'New Tech Term',
      'utsav': 'Jeevan Utsav',
      'amritbal': 'Amritbal',
      'digi term': 'Digi Term',
      'digi': 'Digi Term',
      'cancer': 'Cancer Cover',
      'index plus': 'Index Plus',
      'index': 'Index Plus',
      'shanti': 'New Jeevan Shanti',
      'jeevan shanti': 'New Jeevan Shanti',
      'akshay': 'Jeevan Akshay - VII',
      'jeevan akshay': 'Jeevan Akshay - VII',
      'anand': 'Jeevan Anand',
      'jeevan anand': 'Jeevan Anand',
      'labh': 'Jeevan Labh',
      'jeevan labh': 'Jeevan Labh',
      'umang': 'Jeevan Umang',
      'jeevan umang': 'Jeevan Umang',
      'amrit': 'Jeevan Amrit',
      'jeevan amrit': 'Jeevan Amrit',
      'tarun': 'Jeevan Tarun',
      'jeevan tarun': 'Jeevan Tarun',
      'unicorn': 'Jeevan Unicorn',
      'jeevan unicorn': 'Jeevan Unicorn',
      'stambh': 'Aadhaar Stambh',
      'aadhaar stambh': 'Aadhaar Stambh',
      'shila': 'Aadhaar Shila',
      'aadhaar shila': 'Aadhaar Shila'
    };

    for (const [keyword, policyName] of Object.entries(keywordMap)) {
      if (queryLower.includes(keyword)) {
        return this.policyDatabase.find(p => p.name === policyName) || null;
      }
    }

    return null;
  }

  private findPolicyByPartialMatch(query: string): PolicyInfo | null {
    const queryLower = query.toLowerCase();
    
    // Find by partial name matching
    return this.policyDatabase.find(policy => {
      const policyNameLower = policy.name.toLowerCase();
      const words = queryLower.split(' ');
      
      // Check if any word from query matches part of policy name
      return words.some(word => 
        word.length > 2 && policyNameLower.includes(word)
      );
    }) || null;
  }

  private isPolicyNameQuery(query: string): boolean {
    // Check if the query contains any policy names or keywords
    const policyKeywords = [
      'jeevan', 'tech', 'amritbal', 'digi', 'cancer', 'index', 'shanti', 'akshay',
      'anand', 'labh', 'umang', 'amrit', 'tarun', 'unicorn', 'stambh', 'shila',
      'new tech term', 'jeevan utsav', 'digi term', 'cancer cover', 'index plus',
      'new jeevan shanti', 'jeevan akshay', 'jeevan anand', 'jeevan labh', 'jeevan umang',
      'jeevan amrit', 'jeevan tarun', 'jeevan unicorn', 'aadhaar stambh', 'aadhaar shila'
    ];
    
    const queryLower = query.toLowerCase().trim();
    console.log('isPolicyNameQuery - checking:', queryLower, 'against keywords:', policyKeywords);
    
    const hasKeyword = policyKeywords.some(keyword => queryLower.includes(keyword));
    console.log('isPolicyNameQuery result:', hasKeyword);
    
    return hasKeyword;
  }

  private isDirectPolicyQuery(query: string): boolean {
    // Check if the query is a direct policy name (exact match or close match)
    const queryLower = query.toLowerCase().trim();
    
    // Get all policy names
    const policyNames = this.policyDatabase.map(p => p.name.toLowerCase());
    
    console.log('isDirectPolicyQuery - checking:', queryLower);
    console.log('Available policy names:', policyNames);
    
    // Check for exact match
    if (policyNames.includes(queryLower)) {
      console.log('Exact match found:', queryLower);
      return true;
    }
    
    // Check for partial matches (if query is 3+ characters)
    if (queryLower.length >= 3) {
      const partialMatch = policyNames.some(policyName => {
        const hasMatch = policyName.includes(queryLower) || queryLower.includes(policyName);
        if (hasMatch) {
          console.log('Partial match found:', queryLower, 'matches', policyName);
        }
        return hasMatch;
      });
      
      if (partialMatch) {
        return true;
      }
    }
    
    // Check for individual word matches
    const queryWords = queryLower.split(' ');
    for (const word of queryWords) {
      if (word.length >= 3) {
        const wordMatch = policyNames.some(policyName => policyName.includes(word));
        if (wordMatch) {
          console.log('Word match found:', word);
          return true;
        }
      }
    }
    
    console.log('isDirectPolicyQuery - No match found');
    return false;
  }

  comparePolicies(query: string): string {
    return `🔄 **Policy Comparison Guide:**

I can help you compare policies based on:
• **Category** (Term, Endowment, Whole Life, Unit Linked)
• **Premium Range** (Low, Medium, High)
• **Age Groups** (Child, Young Adult, Senior)
• **Benefits** (Pure Protection vs Investment)

**Popular Comparisons:**
• Term vs Endowment Plans
• New vs Traditional Plans
• Child Plans Comparison

💡 **Ask me:** "Compare [Policy A] and [Policy B]" or "Which policy is better for [age group]?"`;
  }

  getPremiumInfo(query: string): string {
    return `💰 **LIC Policy Premium Information:**

**Premium Ranges by Category:**
• **Term Plans:** ₹3,000 - ₹200,000 per year
• **Endowment Plans:** ₹6,000 - ₹600,000 per year  
• **Whole Life Plans:** ₹8,000 - ₹500,000 per year
• **Unit Linked Plans:** ₹25,000 - ₹500,000 per year
• **Pension Plans:** ₹1,00,000 - ₹50,00,000 (lump sum)
• **Money Back Plans:** ₹15,000 - ₹600,000 per year
• **Child Plans:** ₹6,000 - ₹300,000 per year
• **Health Insurance:** ₹8,000 - ₹200,000 per year
• **Micro Insurance:** ₹500 - ₹3,000 per year

**Factors Affecting Premium:**
• Age at entry
• Sum assured amount
• Policy term
• Payment frequency (Yearly/Half-yearly/Quarterly/Monthly)
• Medical examination results
• Occupation and lifestyle
• Family history

💡 **Ask me:** "What's the premium for [Policy Name] for [Age] years?"`;
  }

  getBenefitsInfo(query: string): string {
    return `🎯 **LIC Policy Benefits Overview:**

**Common Benefits:**
• **Death Benefit:** Financial protection for family
• **Maturity Benefit:** Returns on policy completion
• **Tax Benefits:** Section 80C & 10(10D) deductions
• **Loan Facility:** Available on most policies
• **Bonus:** Regular bonus on participating policies

**Special Benefits by Category:**
• **Term Plans:** High coverage at low cost
• **Endowment Plans:** Savings + Protection
• **Child Plans:** Guaranteed returns for future
• **Health Plans:** Medical expense coverage

💡 **Ask me:** "What benefits does [Policy Name] offer?"`;
  }

  getEligibilityInfo(query: string): string {
    return `👥 **LIC Policy Eligibility Criteria:**

**Age Requirements:**
• **Child Plans:** 0-12 years
• **Term Plans:** 18-65 years
• **Endowment Plans:** 18-65 years
• **Whole Life Plans:** 18-65 years

**Health Requirements:**
• Medical examination for high sum assured
• Standard health declarations
• Pre-existing condition disclosures

**Income Requirements:**
• Annual premium should not exceed 10% of annual income
• Proof of income may be required

💡 **Ask me:** "Am I eligible for [Policy Name] at [Age] years?"`;
  }

  getHelpMessage(): string {
    return `🆘 **How can I help you?**

**Common Questions I can answer:**
• "List all policies" - Show all available LIC policies
• "Tell me about [Policy Name]" - Get detailed policy information
• "Compare [Policy A] and [Policy B]" - Compare two policies
• "What's the premium for [Policy Name]?" - Get premium information
• "Am I eligible for [Policy Name]?" - Check eligibility
• "What are the benefits of [Policy Name]?" - Get benefits details

**Tips:**
• Be specific with policy names
• Mention your age for personalized advice
• Ask about specific features you're interested in

💡 **Just type your question naturally - I understand conversational queries!**`;
  }

  getGeneralResponse(query: string): string {
    // First check if this might be a policy query that wasn't caught earlier
    if (this.isDirectPolicyQuery(query)) {
      return this.getPolicyDetails(query);
    }
    
    const responses = [
      `I understand you're asking about "${query}". Could you be more specific? I can help with policy details, comparisons, or general information.`,
      `That's an interesting question! I specialize in LIC policy information. Try asking about specific policies or use phrases like "list policies" or "tell me about [policy name]".`,
      `I'm here to help with LIC policy information! You can ask me to list all policies, get details about specific plans, or compare different options.`,
      `Could you rephrase your question? I can help with policy details, premium information, eligibility criteria, and comparisons.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  extractPolicyName(query: string): string | null {
    // Enhanced extraction logic for all policies
    const queryLower = query.toLowerCase();
    
    // Direct name matches
    const policyNames = [
      'New Tech Term', 'Jeevan Utsav', 'Amritbal', 'Digi Term', 'Cancer Cover', 'Index Plus',
      'New Jeevan Shanti', 'Jeevan Akshay', 'Jeevan Anand', 'Jeevan Labh', 'Jeevan Umang',
      'Jeevan Amrit', 'Jeevan Tarun', 'Jeevan Unicorn', 'Aadhaar Stambh', 'Aadhaar Shila'
    ];
    
    for (const policyName of policyNames) {
      const nameLower = policyName.toLowerCase();
      if (queryLower.includes(nameLower) || nameLower.includes(queryLower)) {
        return policyName;
      }
    }
    
    // Keyword-based matching
    if (queryLower.includes('tech') && queryLower.includes('term')) return 'New Tech Term';
    if (queryLower.includes('utsav')) return 'Jeevan Utsav';
    if (queryLower.includes('amritbal')) return 'Amritbal';
    if (queryLower.includes('digi') && queryLower.includes('term')) return 'Digi Term';
    if (queryLower.includes('cancer')) return 'Cancer Cover';
    if (queryLower.includes('index')) return 'Index Plus';
    if (queryLower.includes('shanti')) return 'New Jeevan Shanti';
    if (queryLower.includes('akshay')) return 'Jeevan Akshay - VII';
    if (queryLower.includes('anand')) return 'Jeevan Anand';
    if (queryLower.includes('labh')) return 'Jeevan Labh';
    if (queryLower.includes('umang')) return 'Jeevan Umang';
    if (queryLower.includes('amrit')) return 'Jeevan Amrit';
    if (queryLower.includes('tarun')) return 'Jeevan Tarun';
    if (queryLower.includes('unicorn')) return 'Jeevan Unicorn';
    if (queryLower.includes('stambh')) return 'Aadhaar Stambh';
    if (queryLower.includes('shila')) return 'Aadhaar Shila';
    
    return null;
  }

  toggleMinimize() {
    if (!this.isMinimized) {
      // Store current position before minimizing
      this.previousPosition = { ...this.position };
      this.isMinimized = true;
      this.moveToBottomRight();
    } else {
      // Restore previous position when maximizing
      this.isMinimized = false;
      this.position = { ...this.previousPosition };
      
      // Ensure the restored position is fully visible on screen
      this.ensureFullyVisible();
      
      // Add a subtle highlight effect to show it's been positioned
      this.showPositioningFeedback();
    }
  }

  private moveToBottomRight() {
    // Position in bottom-right corner when minimized
    this.position.x = window.innerWidth - 320; // 300px widget + 20px margin
    this.position.y = window.innerHeight - 100; // 80px widget + 20px margin
  }

  private ensureFullyVisible() {
    // Widget dimensions when maximized
    const widgetWidth = 400;
    const widgetHeight = 600;
    const margin = 20; // Minimum margin from screen edges
    
    // Calculate maximum allowed positions
    const maxX = window.innerWidth - widgetWidth - margin;
    const maxY = window.innerHeight - widgetHeight - margin;
    
    // Ensure widget is fully visible with margins
    this.position.x = Math.max(margin, Math.min(this.position.x, maxX));
    this.position.y = Math.max(margin, Math.min(this.position.y, maxY));
    
    // If the previous position would make the widget go off-screen,
    // position it in the default bottom-right location
    if (this.position.x > maxX || this.position.y > maxY) {
      this.position.x = window.innerWidth - widgetWidth - margin;
      this.position.y = window.innerHeight - widgetHeight - margin;
    }
  }

  private ensureWidgetInBounds() {
    const maxX = window.innerWidth - (this.isMinimized ? 300 : 400);
    const maxY = window.innerHeight - (this.isMinimized ? 80 : 600);
    
    this.position.x = Math.max(0, Math.min(this.position.x, maxX));
    this.position.y = Math.max(0, Math.min(this.position.y, maxY));
  }

  private showPositioningFeedback() {
    // Add a temporary class for visual feedback
    const container = document.querySelector('.floating-chatbot-container');
    if (container) {
      container.classList.add('positioning-feedback');
      setTimeout(() => {
        container.classList.remove('positioning-feedback');
      }, 1000);
    }
  }

  clearChat() {
    this.messages = [];
    this.addWelcomeMessage();
  }

  formatMessage(content: string): string {
    // Convert markdown-like formatting to HTML
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
  }

  formatTime(timestamp: Date): string {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Drag functionality methods
  onMouseDown(event: MouseEvent) {
    if (event.target instanceof Element) {
      // Check if the click is on the header (draggable area)
      const header = event.target.closest('.chatbot-header');
      if (header) {
        this.isDragging = true;
        this.dragOffset.x = event.clientX - this.position.x;
        this.dragOffset.y = event.clientY - this.position.y;
        
        // Prevent text selection during drag
        event.preventDefault();
        
        // Add global event listeners
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
      }
    }
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const newX = event.clientX - this.dragOffset.x;
      const newY = event.clientY - this.dragOffset.y;
      
      // Set position
      this.position.x = newX;
      this.position.y = newY;
      
      // Ensure widget stays within bounds based on current state
      if (this.isMinimized) {
        this.ensureWidgetInBounds();
      } else {
        this.ensureFullyVisible();
      }
    }
  }

  onMouseUp() {
    this.isDragging = false;
    
    // Remove global event listeners
    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
  }

  // Initialize position on component load
  ngOnInit() {
    // Check initial route
    this.updateChatbotVisibility();
    
    // Subscribe to route changes
    this.routeSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.updateChatbotVisibility();
      });
  }

  ngOnDestroy() {
    this.routeSubscription.unsubscribe();
  }

  private updateChatbotVisibility() {
    const userRole = sessionStorage.getItem('role') || '';
    const shouldShow = this.router.url !== '/login' && userRole === 'lic';
    
    if (shouldShow !== this.showChatbot) {
      this.showChatbot = shouldShow;
      
      if (this.showChatbot && this.messages.length === 0) {
        this.addWelcomeMessage();
        this.initializePosition();
      }
    }
  }

  initializePosition() {
    // Start in minimized mode at bottom-right corner
    this.moveToBottomRight();
    this.previousPosition = { ...this.position };
  }
}
