import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<string>('en');
  public currentLanguage$ = this.currentLanguageSubject.asObservable();

  private translations: { [key: string]: { [key: string]: string } } = {
    en: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.customers': 'Customers',
      'nav.deposits': 'Deposits',
      'nav.reports': 'Reports',
      'nav.policies': 'Policies',
      'nav.clothaura': 'ClothAura',
      'nav.settings': 'Settings',
      
      // Common
      'common.add': 'Add',
      'common.edit': 'Edit',
      'common.delete': 'Delete',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.close': 'Close',
      'common.view': 'View',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.reset': 'Reset',
      'common.submit': 'Submit',
      'common.loading': 'Loading...',
      'common.error': 'Error',
      'common.success': 'Success',
      'common.warning': 'Warning',
      'common.info': 'Info',
      'common.yes': 'Yes',
      'common.no': 'No',
      'common.confirm': 'Confirm',
      'common.name': 'Name',
      'common.phone': 'Phone',
      'common.email': 'Email',
      'common.address': 'Address',
      'common.date': 'Date',
      'common.amount': 'Amount',
      'common.status': 'Status',
      'common.actions': 'Actions',
      'common.total': 'Total',
      'common.quantity': 'Quantity',
      'common.price': 'Price',
      'common.description': 'Description',
      'common.print': 'Print',
      'common.logout': 'Logout',
      
      // ClothAura
      'clothaura.title': 'ClothAura - Laundry Management',
      'clothaura.orders': 'Orders',
      'clothaura.customers': 'Customers',
      'clothaura.services': 'Services',
      'clothaura.billing': 'Billing',
      'clothaura.settings': 'Settings',
      'clothaura.bill_setup': 'Bill Setup',
      'clothaura.configure': 'Configure',
      'clothaura.generate_bill': 'Generate Bill',
      'clothaura.view_bill': 'View Bill',
      'clothaura.customer_name': 'Customer Name',
      'clothaura.customer_phone': 'Phone Number',
      'clothaura.service_type': 'Service Type',
      'clothaura.due_date': 'Due Date',
      'clothaura.notes': 'Notes',
      'clothaura.selected_items': 'Selected Items',
      'clothaura.add_item': 'Add Item',
      'clothaura.remove_item': 'Remove Item',
      'clothaura.bill_total': 'Bill Total',
      'clothaura.pending': 'Pending',
      'clothaura.paid': 'Paid',
      'clothaura.partial': 'Partial',
      'clothaura.laundry': 'Laundry',
      'clothaura.dry_clean': 'Dry Clean',
      'clothaura.ironing': 'Ironing',
      'clothaura.men': 'Men',
      'clothaura.women': 'Women',
      'clothaura.children': 'Children',
      'clothaura.kids': 'Kids',
      
      // Billing Config
      'billing_config.title': 'Billing Configuration',
      'billing_config.company_name': 'Company Name',
      'billing_config.company_address': 'Company Address',
      'billing_config.company_phone': 'Company Phone',
      'billing_config.company_email': 'Company Email',
      'billing_config.company_website': 'Company Website',
      'billing_config.tax_id': 'Tax ID / GST Number',
      'billing_config.tax_rate': 'Tax Rate (%)',
      'billing_config.payment_terms': 'Payment Terms',
      'billing_config.footer_text': 'Footer Text',
      'billing_config.preview': 'Preview',
      'billing_config.invoice': 'Invoice',
      'billing_config.bill_to': 'Bill To',
      'billing_config.item': 'Item',
      'billing_config.qty': 'Qty',
      'billing_config.rate': 'Rate',
      'billing_config.subtotal': 'Subtotal',
      'billing_config.tax': 'Tax',
      'billing_config.grand_total': 'Grand Total',
      'billing_config.thank_you': 'Thank you for your business!',
      
      // Messages
      'messages.bill_generated': 'Bill generated successfully!',
      'messages.bill_saved': 'Bill saved successfully!',
      'messages.customer_updated': 'Customer updated successfully!',
      'messages.customer_created': 'Customer created successfully!',
      'messages.error_saving': 'Error saving to database. Please try again.',
      'messages.error_loading': 'Error loading data. Please try again.',
      'messages.confirm_delete': 'Are you sure you want to delete this item?',
      'messages.no_items_selected': 'Please select at least one item.',
      'messages.fill_required_fields': 'Please fill all required fields.',
      
      // Form Labels
      'form.required': 'Required',
      'form.optional': 'Optional',
      'form.select_customer': 'Select Customer',
      'form.select_service': 'Select Service',
      'form.enter_quantity': 'Enter Quantity',
      'form.enter_notes': 'Enter Notes',
      'form.select_due_date': 'Select Due Date',
      
      // Status
      'status.new': 'New',
      'status.in_progress': 'In Progress',
      'status.completed': 'Completed',
      'status.delivered': 'Delivered',
      'status.billed': 'Billed',
      'status.cancelled': 'Cancelled'
    },
    hi: {
      // Navigation
      'nav.dashboard': 'डैशबोर्ड',
      'nav.customers': 'ग्राहक',
      'nav.deposits': 'जमा',
      'nav.reports': 'रिपोर्ट',
      'nav.policies': 'नीतियां',
      'nav.clothaura': 'क्लॉथऑरा',
      'nav.settings': 'सेटिंग्स',
      
      // Common
      'common.add': 'जोड़ें',
      'common.edit': 'संपादित करें',
      'common.delete': 'हटाएं',
      'common.save': 'सेव करें',
      'common.cancel': 'रद्द करें',
      'common.close': 'बंद करें',
      'common.view': 'देखें',
      'common.search': 'खोजें',
      'common.filter': 'फिल्टर',
      'common.reset': 'रीसेट',
      'common.submit': 'सबमिट',
      'common.loading': 'लोड हो रहा है...',
      'common.error': 'त्रुटि',
      'common.success': 'सफलता',
      'common.warning': 'चेतावनी',
      'common.info': 'जानकारी',
      'common.yes': 'हां',
      'common.no': 'नहीं',
      'common.confirm': 'पुष्टि करें',
      'common.name': 'नाम',
      'common.phone': 'फोन',
      'common.email': 'ईमेल',
      'common.address': 'पता',
      'common.date': 'तारीख',
      'common.amount': 'राशि',
      'common.status': 'स्थिति',
      'common.actions': 'कार्य',
      'common.total': 'कुल',
      'common.quantity': 'मात्रा',
      'common.price': 'मूल्य',
      'common.description': 'विवरण',
      'common.print': 'प्रिंट',
      'common.logout': 'लॉगआउट',
      
      // ClothAura
      'clothaura.title': 'क्लॉथऑरा - लॉन्ड्री प्रबंधन',
      'clothaura.orders': 'ऑर्डर',
      'clothaura.customers': 'ग्राहक',
      'clothaura.services': 'सेवाएं',
      'clothaura.billing': 'बिलिंग',
      'clothaura.settings': 'सेटिंग्स',
      'clothaura.bill_setup': 'बिल सेटअप',
      'clothaura.configure': 'कॉन्फ़िगर करें',
      'clothaura.generate_bill': 'बिल जेनरेट करें',
      'clothaura.view_bill': 'बिल देखें',
      'clothaura.customer_name': 'ग्राहक का नाम',
      'clothaura.customer_phone': 'फोन नंबर',
      'clothaura.service_type': 'सेवा प्रकार',
      'clothaura.due_date': 'देय तिथि',
      'clothaura.notes': 'नोट्स',
      'clothaura.selected_items': 'चयनित आइटम',
      'clothaura.add_item': 'आइटम जोड़ें',
      'clothaura.remove_item': 'आइटम हटाएं',
      'clothaura.bill_total': 'बिल कुल',
      'clothaura.pending': 'लंबित',
      'clothaura.paid': 'भुगतान',
      'clothaura.partial': 'आंशिक',
      'clothaura.laundry': 'लॉन्ड्री',
      'clothaura.dry_clean': 'ड्राई क्लीन',
      'clothaura.ironing': 'प्रेसिंग',
      'clothaura.men': 'पुरुष',
      'clothaura.women': 'महिला',
      'clothaura.children': 'बच्चे',
      'clothaura.kids': 'बच्चे',
      
      // ClothAura Buttons
      'clothaura.add_customer': 'ग्राहक जोड़ें',
      'clothaura.add_service': 'सेवा जोड़ें',
      'clothaura.edit_customer': 'ग्राहक संपादित करें',
      'clothaura.edit_service': 'सेवा संपादित करें',
      'clothaura.delete_customer': 'ग्राहक हटाएं',
      'clothaura.delete_service': 'सेवा हटाएं',
      'clothaura.view_customer': 'ग्राहक देखें',
      'clothaura.view_order': 'ऑर्डर देखें',
      'clothaura.mark_delivered': 'डिलीवर मार्क करें',
      'clothaura.mark_billed': 'बिल्ड मार्क करें',
      'clothaura.mark_paid': 'भुगतान मार्क करें',
      'clothaura.move_to_billed': 'बिल्ड में ले जाएं',
      'clothaura.refresh': 'रिफ्रेश करें',
      'clothaura.search_customers': 'ग्राहक खोजें...',
      'clothaura.search_services': 'सेवाएं खोजें...',
      'clothaura.filter_services': 'सेवाएं फिल्टर करें',
      'clothaura.clear_cart': 'कार्ट साफ करें',
      'clothaura.add_to_cart': 'कार्ट में जोड़ें',
      'clothaura.remove_from_cart': 'कार्ट से हटाएं',
      'clothaura.update_cart': 'कार्ट अपडेट करें',
      'clothaura.calculate_total': 'कुल गणना करें',
      'clothaura.submit_bill': 'बिल सबमिट करें',
      'clothaura.close_modal': 'मोडल बंद करें',
      'clothaura.save_changes': 'बदलाव सेव करें',
      'clothaura.cancel': 'रद्द करें',
      'clothaura.confirm': 'पुष्टि करें',
      'clothaura.yes': 'हां',
      'clothaura.no': 'नहीं',
      'clothaura.ok': 'ठीक है',
      
      // Service Items - Men
      'service.men_formal_shirt': 'पुरुष फॉर्मल शर्ट',
      'service.men_casual_shirt': 'पुरुष कैजुअल शर्ट',
      'service.men_tshirt': 'पुरुष टी-शर्ट',
      'service.men_polo_shirt': 'पुरुष पोलो शर्ट',
      'service.men_tank_top': 'पुरुष टैंक टॉप',
      'service.men_hoodie': 'पुरुष हुडी',
      'service.men_sweatshirt': 'पुरुष स्वेटशर्ट',
      'service.men_formal_trousers': 'पुरुष फॉर्मल पैंट',
      'service.men_casual_trousers': 'पुरुष कैजुअल पैंट',
      'service.men_jeans': 'पुरुष जींस',
      'service.men_shorts': 'पुरुष शॉर्ट्स',
      'service.men_track_pants': 'पुरुष ट्रैक पैंट',
      'service.men_suit_jacket': 'पुरुष सूट जैकेट',
      'service.men_blazer': 'पुरुष ब्लेज़र',
      'service.men_waistcoat': 'पुरुष वेस्टकोट',
      'service.men_coat': 'पुरुष कोट',
      'service.men_jacket': 'पुरुष जैकेट',
      'service.men_sweater': 'पुरुष स्वेटर',
      'service.men_cardigan': 'पुरुष कार्डिगन',
      'service.men_vest': 'पुरुष वेस्ट',
      'service.men_kurta': 'पुरुष कुर्ता',
      'service.men_pyjama': 'पुरुष पजामा',
      'service.men_lungi': 'पुरुष लुंगी',
      'service.men_underwear': 'पुरुष अंडरवियर',
      'service.men_socks': 'पुरुष मोजे',
      
      // Service Items - Women
      'service.women_formal_shirt': 'महिला फॉर्मल शर्ट',
      'service.women_casual_shirt': 'महिला कैजुअल शर्ट',
      'service.women_tshirt': 'महिला टी-शर्ट',
      'service.women_tank_top': 'महिला टैंक टॉप',
      'service.women_blouse': 'महिला ब्लाउज',
      'service.women_kurta': 'महिला कुर्ता',
      'service.women_salwar_kameez': 'महिला सलवार कमीज',
      'service.women_saree': 'महिला साड़ी',
      'service.women_lehenga': 'महिला लहंगा',
      'service.women_skirt': 'महिला स्कर्ट',
      'service.women_dress': 'महिला ड्रेस',
      'service.women_jeans': 'महिला जींस',
      'service.women_trousers': 'महिला पैंट',
      'service.women_shorts': 'महिला शॉर्ट्स',
      'service.women_hoodie': 'महिला हुडी',
      'service.women_sweatshirt': 'महिला स्वेटशर्ट',
      'service.women_sweater': 'महिला स्वेटर',
      'service.women_cardigan': 'महिला कार्डिगन',
      'service.women_jacket': 'महिला जैकेट',
      'service.women_coat': 'महिला कोट',
      'service.women_crop_top': 'महिला क्रॉप टॉप',
      'service.women_formal_dress': 'महिला फॉर्मल ड्रेस',
      'service.women_casual_dress': 'महिला कैजुअल ड्रेस',
      'service.women_maxi_dress': 'महिला मैक्सी ड्रेस',
      'service.women_mini_skirt': 'महिला मिनी स्कर्ट',
      'service.women_midi_skirt': 'महिला मिडी स्कर्ट',
      'service.women_maxi_skirt': 'महिला मैक्सी स्कर्ट',
      'service.women_leggings': 'महिला लेगिंग्स',
      'service.women_jeggings': 'महिला जेगिंग्स',
      'service.women_palazzo': 'महिला पलाज्जो',
      'service.women_churidar': 'महिला चूड़ीदार',
      'service.women_blazer': 'महिला ब्लेज़र',
      'service.women_vest': 'महिला वेस्ट',
      'service.women_underwear': 'महिला अंडरवियर',
      'service.women_socks': 'महिला मोजे',
      
      // Service Items - Children
      'service.children_tshirt': 'बच्चों की टी-शर्ट',
      'service.children_shirt': 'बच्चों की शर्ट',
      'service.children_tank_top': 'बच्चों का टैंक टॉप',
      'service.children_hoodie': 'बच्चों की हुडी',
      'service.children_sweatshirt': 'बच्चों की स्वेटशर्ट',
      'service.children_jeans': 'बच्चों की जींस',
      'service.children_trousers': 'बच्चों की पैंट',
      'service.children_shorts': 'बच्चों के शॉर्ट्स',
      'service.children_track_pants': 'बच्चों की ट्रैक पैंट',
      'service.children_dress': 'बच्चों की ड्रेस',
      'service.children_skirt': 'बच्चों की स्कर्ट',
      'service.children_sweater': 'बच्चों का स्वेटर',
      'service.children_jacket': 'बच्चों की जैकेट',
      'service.children_uniform': 'बच्चों की यूनिफॉर्म',
      'service.boy_shirt': 'लड़के की शर्ट',
      'service.boy_shorts': 'लड़के के शॉर्ट्स',
      'service.boy_tshirt': 'लड़के की टी-शर्ट',
      'service.boy_pants': 'लड़के की पैंट',
      'service.girl_dress': 'लड़की की ड्रेस',
      'service.girl_skirt': 'लड़की की स्कर्ट',
      'service.girl_top': 'लड़की का टॉप',
      'service.girl_frock': 'लड़की का फ्रॉक',
      
      // Service Descriptions
      'service.desc_wash_iron': 'धोकर प्रेस करें',
      'service.desc_dry_clean': 'ड्राई क्लीन करें',
      'service.desc_iron_only': 'केवल प्रेस करें',
      'service.desc_wash_only': 'केवल धोएं',
      
      // ClothAura Status
      'clothaura.status.new': 'नया',
      'clothaura.status.in_progress': 'प्रगति में',
      'clothaura.status.ready': 'तैयार',
      'clothaura.status.delivered': 'डिलीवर',
      'clothaura.status.billed': 'बिल्ड',
      'clothaura.status.cancelled': 'रद्द',
      
      // ClothAura Messages
      'clothaura.msg.customer_added': 'ग्राहक सफलतापूर्वक जोड़ा गया!',
      'clothaura.msg.customer_updated': 'ग्राहक सफलतापूर्वक अपडेट हुआ!',
      'clothaura.msg.customer_deleted': 'ग्राहक सफलतापूर्वक हटाया गया!',
      'clothaura.msg.service_added': 'सेवा सफलतापूर्वक जोड़ी गई!',
      'clothaura.msg.service_updated': 'सेवा सफलतापूर्वक अपडेट हुई!',
      'clothaura.msg.service_deleted': 'सेवा सफलतापूर्वक हटाई गई!',
      'clothaura.msg.bill_generated': 'बिल सफलतापूर्वक जेनरेट हुआ!',
      'clothaura.msg.order_delivered': 'ऑर्डर सफलतापूर्वक डिलीवर हुआ!',
      'clothaura.msg.order_billed': 'ऑर्डर सफलतापूर्वक बिल्ड हुआ!',
      'clothaura.msg.cart_cleared': 'कार्ट सफलतापूर्वक साफ हुआ!',
      'clothaura.msg.item_added_to_cart': 'आइटम कार्ट में जोड़ा गया!',
      'clothaura.msg.item_removed_from_cart': 'आइटम कार्ट से हटाया गया!',
      'clothaura.msg.confirm_delete_customer': 'क्या आप वाकई इस ग्राहक को हटाना चाहते हैं?',
      'clothaura.msg.confirm_delete_service': 'क्या आप वाकई इस सेवा को हटाना चाहते हैं?',
      'clothaura.msg.confirm_deliver_order': 'क्या आप वाकई इस ऑर्डर को डिलीवर मार्क करना चाहते हैं?',
      'clothaura.msg.confirm_bill_order': 'क्या आप वाकई इस ऑर्डर को बिल्ड मार्क करना चाहते हैं?',
      'clothaura.msg.no_items_in_cart': 'कार्ट में कोई आइटम नहीं है',
      'clothaura.msg.select_customer_first': 'पहले ग्राहक चुनें',
      'clothaura.msg.fill_required_fields': 'कृपया सभी आवश्यक फील्ड भरें',
      'clothaura.msg.invalid_quantity': 'अमान्य मात्रा',
      'clothaura.msg.service_not_found': 'सेवा नहीं मिली',
      'clothaura.msg.customer_not_found': 'ग्राहक नहीं मिला',
      'clothaura.msg.order_not_found': 'ऑर्डर नहीं मिला',
      
      // Billing Config
      'billing_config.title': 'बिलिंग कॉन्फ़िगरेशन',
      'billing_config.company_name': 'कंपनी का नाम',
      'billing_config.company_address': 'कंपनी का पता',
      'billing_config.company_phone': 'कंपनी का फोन',
      'billing_config.company_email': 'कंपनी का ईमेल',
      'billing_config.company_website': 'कंपनी की वेबसाइट',
      'billing_config.tax_id': 'टैक्स आईडी / जीएसटी नंबर',
      'billing_config.tax_rate': 'टैक्स दर (%)',
      'billing_config.payment_terms': 'भुगतान शर्तें',
      'billing_config.footer_text': 'फुटर टेक्स्ट',
      'billing_config.preview': 'पूर्वावलोकन',
      'billing_config.invoice': 'चालान',
      'billing_config.bill_to': 'बिल टू',
      'billing_config.item': 'आइटम',
      'billing_config.qty': 'मात्रा',
      'billing_config.rate': 'दर',
      'billing_config.subtotal': 'उप-योग',
      'billing_config.tax': 'टैक्स',
      'billing_config.grand_total': 'कुल योग',
      'billing_config.thank_you': 'आपके व्यवसाय के लिए धन्यवाद!',
      
      // Messages
      'messages.bill_generated': 'बिल सफलतापूर्वक जेनरेट हुआ!',
      'messages.bill_saved': 'बिल सफलतापूर्वक सेव हुआ!',
      'messages.customer_updated': 'ग्राहक सफलतापूर्वक अपडेट हुआ!',
      'messages.customer_created': 'ग्राहक सफलतापूर्वक बनाया गया!',
      'messages.error_saving': 'डेटाबेस में सेव करने में त्रुटि। कृपया पुनः प्रयास करें।',
      'messages.error_loading': 'डेटा लोड करने में त्रुटि। कृपया पुनः प्रयास करें।',
      'messages.confirm_delete': 'क्या आप वाकई इस आइटम को हटाना चाहते हैं?',
      'messages.no_items_selected': 'कृपया कम से कम एक आइटम चुनें।',
      'messages.fill_required_fields': 'कृपया सभी आवश्यक फील्ड भरें।',
      
      // Form Labels
      'form.required': 'आवश्यक',
      'form.optional': 'वैकल्पिक',
      'form.select_customer': 'ग्राहक चुनें',
      'form.select_service': 'सेवा चुनें',
      'form.enter_quantity': 'मात्रा दर्ज करें',
      'form.enter_notes': 'नोट्स दर्ज करें',
      'form.select_due_date': 'देय तिथि चुनें',
      
      // Status
      'status.new': 'नया',
      'status.in_progress': 'प्रगति में',
      'status.completed': 'पूर्ण',
      'status.delivered': 'डिलीवर',
      'status.billed': 'बिल्ड',
      'status.cancelled': 'रद्द'
    }
  };

  public languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' }
  ];

  constructor() {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('app-language');
    if (savedLanguage && this.translations[savedLanguage]) {
      this.currentLanguageSubject.next(savedLanguage);
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguageSubject.value;
  }

  setLanguage(languageCode: string): void {
    if (this.translations[languageCode]) {
      this.currentLanguageSubject.next(languageCode);
      localStorage.setItem('app-language', languageCode);
    }
  }

  translate(key: string): string {
    const currentLang = this.getCurrentLanguage();
    const translation = this.translations[currentLang]?.[key];
    return translation || key;
  }

  getLanguages(): Language[] {
    return this.languages;
  }

  isRTL(): boolean {
    return this.getCurrentLanguage() === 'ar'; // For future Arabic support
  }

  translateServiceName(serviceName: string): string {
    const currentLang = this.getCurrentLanguage();
    if (currentLang === 'en') {
      return serviceName; // Return original English name
    }
    
    // Map English service names to Hindi - using direct strings to avoid circular dependency
    const serviceNameMap: { [key: string]: string } = {
      'Men Formal Shirt': 'पुरुष फॉर्मल शर्ट',
      'Men Casual Shirt': 'पुरुष कैजुअल शर्ट',
      'Men T-Shirt': 'पुरुष टी-शर्ट',
      'Men Polo Shirt': 'पुरुष पोलो शर्ट',
      'Men Tank Top': 'पुरुष टैंक टॉप',
      'Men Hoodie': 'पुरुष हुडी',
      'Men Sweatshirt': 'पुरुष स्वेटशर्ट',
      'Men Formal Trousers': 'पुरुष फॉर्मल पैंट',
      'Men Casual Trousers': 'पुरुष कैजुअल पैंट',
      'Men Jeans': 'पुरुष जींस',
      'Men Shorts': 'पुरुष शॉर्ट्स',
      'Men Track Pants': 'पुरुष ट्रैक पैंट',
      'Men Suit Jacket': 'पुरुष सूट जैकेट',
      'Men Blazer': 'पुरुष ब्लेज़र',
      'Men Waistcoat': 'पुरुष वेस्टकोट',
      'Men Coat': 'पुरुष कोट',
      'Men Jacket': 'पुरुष जैकेट',
      'Men Sweater': 'पुरुष स्वेटर',
      'Men Cardigan': 'पुरुष कार्डिगन',
      'Men Vest': 'पुरुष वेस्ट',
      'Men Kurta': 'पुरुष कुर्ता',
      'Men Pyjama': 'पुरुष पजामा',
      'Men Lungi': 'पुरुष लुंगी',
      'Men Underwear': 'पुरुष अंडरवियर',
      'Men Socks': 'पुरुष मोजे',
      
      'Women Formal Shirt': 'महिला फॉर्मल शर्ट',
      'Women Casual Shirt': 'महिला कैजुअल शर्ट',
      'Women T-Shirt': 'महिला टी-शर्ट',
      'Women Tank Top': 'महिला टैंक टॉप',
      'Women Blouse': 'महिला ब्लाउज',
      'Women Kurta': 'महिला कुर्ता',
      'Women Salwar Kameez': 'महिला सलवार कमीज',
      'Women Saree': 'महिला साड़ी',
      'Women Lehenga': 'महिला लहंगा',
      'Women Skirt': 'महिला स्कर्ट',
      'Women Dress': 'महिला ड्रेस',
      'Women Jeans': 'महिला जींस',
      'Women Trousers': 'महिला पैंट',
      'Women Shorts': 'महिला शॉर्ट्स',
      'Women Hoodie': 'महिला हुडी',
      'Women Sweatshirt': 'महिला स्वेटशर्ट',
      'Women Sweater': 'महिला स्वेटर',
      'Women Cardigan': 'महिला कार्डिगन',
      'Women Jacket': 'महिला जैकेट',
      'Women Coat': 'महिला कोट',
      'Women Crop Top': 'महिला क्रॉप टॉप',
      'Women Formal Dress': 'महिला फॉर्मल ड्रेस',
      'Women Casual Dress': 'महिला कैजुअल ड्रेस',
      'Women Maxi Dress': 'महिला मैक्सी ड्रेस',
      'Women Mini Skirt': 'महिला मिनी स्कर्ट',
      'Women Midi Skirt': 'महिला मिडी स्कर्ट',
      'Women Maxi Skirt': 'महिला मैक्सी स्कर्ट',
      'Women Leggings': 'महिला लेगिंग्स',
      'Women Jeggings': 'महिला जेगिंग्स',
      'Women Palazzo': 'महिला पलाज्जो',
      'Women Churidar': 'महिला चूड़ीदार',
      'Women Blazer': 'महिला ब्लेज़र',
      'Women Vest': 'महिला वेस्ट',
      'Women Underwear': 'महिला अंडरवियर',
      'Women Socks': 'महिला मोजे',
      
      'Children T-Shirt': 'बच्चों की टी-शर्ट',
      'Children Shirt': 'बच्चों की शर्ट',
      'Children Tank Top': 'बच्चों का टैंक टॉप',
      'Children Hoodie': 'बच्चों की हुडी',
      'Children Sweatshirt': 'बच्चों की स्वेटशर्ट',
      'Children Jeans': 'बच्चों की जींस',
      'Children Trousers': 'बच्चों की पैंट',
      'Children Shorts': 'बच्चों के शॉर्ट्स',
      'Children Track Pants': 'बच्चों की ट्रैक पैंट',
      'Children Dress': 'बच्चों की ड्रेस',
      'Children Skirt': 'बच्चों की स्कर्ट',
      'Children Sweater': 'बच्चों का स्वेटर',
      'Children Jacket': 'बच्चों की जैकेट',
      'Children Uniform': 'बच्चों की यूनिफॉर्म',
      'Boy Shirt': 'लड़के की शर्ट',
      'Boy Shorts': 'लड़के के शॉर्ट्स',
      'Boy T-Shirt': 'लड़के की टी-शर्ट',
      'Boy Pants': 'लड़के की पैंट',
      'Girl Dress': 'लड़की की ड्रेस',
      'Girl Skirt': 'लड़की की स्कर्ट',
      'Girl Top': 'लड़की का टॉप',
      'Girl Frock': 'लड़की का फ्रॉक'
    };
    
    return serviceNameMap[serviceName] || serviceName;
  }

  translateServiceDescription(description: string): string {
    const currentLang = this.getCurrentLanguage();
    if (currentLang === 'en') {
      return description; // Return original English description
    }
    
    // Map English descriptions to Hindi - using direct strings to avoid circular dependency
    const descriptionMap: { [key: string]: string } = {
      'Wash & Iron for Men Formal Shirts': 'धोकर प्रेस करें - पुरुष फॉर्मल शर्ट',
      'Wash & Iron for Men Casual Shirts': 'धोकर प्रेस करें - पुरुष कैजुअल शर्ट',
      'Wash & Iron for Men T-Shirts': 'धोकर प्रेस करें - पुरुष टी-शर्ट',
      'Wash & Iron for Men Polo Shirts': 'धोकर प्रेस करें - पुरुष पोलो शर्ट',
      'Wash & Iron for Men Tank Tops': 'धोकर प्रेस करें - पुरुष टैंक टॉप',
      'Wash & Iron for Men Hoodies': 'धोकर प्रेस करें - पुरुष हुडी',
      'Wash & Iron for Men Sweatshirts': 'धोकर प्रेस करें - पुरुष स्वेटशर्ट',
      'Wash & Iron for Men Formal Trousers': 'धोकर प्रेस करें - पुरुष फॉर्मल पैंट',
      'Wash & Iron for Men Casual Trousers': 'धोकर प्रेस करें - पुरुष कैजुअल पैंट',
      'Wash & Iron for Men Jeans': 'धोकर प्रेस करें - पुरुष जींस',
      'Wash & Iron for Men Shorts': 'धोकर प्रेस करें - पुरुष शॉर्ट्स',
      'Wash & Iron for Men Track Pants': 'धोकर प्रेस करें - पुरुष ट्रैक पैंट',
      'Dry Clean for Men Suit Jackets': 'ड्राई क्लीन करें - पुरुष सूट जैकेट',
      'Dry Clean for Men Blazers': 'ड्राई क्लीन करें - पुरुष ब्लेज़र',
      'Dry Clean for Men Waistcoats': 'ड्राई क्लीन करें - पुरुष वेस्टकोट',
      'Dry Clean for Men Coats': 'ड्राई क्लीन करें - पुरुष कोट',
      'Wash & Iron for Men Jackets': 'धोकर प्रेस करें - पुरुष जैकेट',
      'Wash & Iron for Men Sweaters': 'धोकर प्रेस करें - पुरुष स्वेटर',
      'Wash & Iron for Men Cardigans': 'धोकर प्रेस करें - पुरुष कार्डिगन',
      'Wash & Iron for Men Vests': 'धोकर प्रेस करें - पुरुष वेस्ट',
      'Wash & Iron for Men Kurtas': 'धोकर प्रेस करें - पुरुष कुर्ता',
      'Wash & Iron for Men Pyjamas': 'धोकर प्रेस करें - पुरुष पजामा',
      'Wash & Iron for Men Lungis': 'धोकर प्रेस करें - पुरुष लुंगी',
      'Wash & Iron for Men Underwear': 'धोकर प्रेस करें - पुरुष अंडरवियर',
      'Wash & Iron for Men Socks': 'धोकर प्रेस करें - पुरुष मोजे',
      
      // Women's service descriptions
      'Wash & Iron for Women Formal Shirts': 'धोकर प्रेस करें - महिला फॉर्मल शर्ट',
      'Wash & Iron for Women Casual Shirts': 'धोकर प्रेस करें - महिला कैजुअल शर्ट',
      'Wash & Iron for Women T-Shirts': 'धोकर प्रेस करें - महिला टी-शर्ट',
      'Wash & Iron for Women Tank Tops': 'धोकर प्रेस करें - महिला टैंक टॉप',
      'Wash & Iron for Women Blouses': 'धोकर प्रेस करें - महिला ब्लाउज',
      'Wash & Iron for Women Kurtas': 'धोकर प्रेस करें - महिला कुर्ता',
      'Wash & Iron for Women Salwar Kameez': 'धोकर प्रेस करें - महिला सलवार कमीज',
      'Dry Clean for Women Sarees': 'ड्राई क्लीन करें - महिला साड़ी',
      'Dry Clean for Women Lehengas': 'ड्राई क्लीन करें - महिला लहंगा',
      'Wash & Iron for Women Skirts': 'धोकर प्रेस करें - महिला स्कर्ट',
      'Wash & Iron for Women Dresses': 'धोकर प्रेस करें - महिला ड्रेस',
      'Wash & Iron for Women Jeans': 'धोकर प्रेस करें - महिला जींस',
      'Wash & Iron for Women Trousers': 'धोकर प्रेस करें - महिला पैंट',
      'Wash & Iron for Women Shorts': 'धोकर प्रेस करें - महिला शॉर्ट्स',
      'Wash & Iron for Women Hoodies': 'धोकर प्रेस करें - महिला हुडी',
      'Wash & Iron for Women Sweatshirts': 'धोकर प्रेस करें - महिला स्वेटशर्ट',
      'Wash & Iron for Women Sweaters': 'धोकर प्रेस करें - महिला स्वेटर',
      'Wash & Iron for Women Cardigans': 'धोकर प्रेस करें - महिला कार्डिगन',
      'Wash & Iron for Women Jackets': 'धोकर प्रेस करें - महिला जैकेट',
      'Dry Clean for Women Coats': 'ड्राई क्लीन करें - महिला कोट',
      'Wash & Iron for Women Crop Tops': 'धोकर प्रेस करें - महिला क्रॉप टॉप',
      'Dry Clean for Women Formal Dresses': 'ड्राई क्लीन करें - महिला फॉर्मल ड्रेस',
      'Wash & Iron for Women Casual Dresses': 'धोकर प्रेस करें - महिला कैजुअल ड्रेस',
      'Wash & Iron for Women Maxi Dresses': 'धोकर प्रेस करें - महिला मैक्सी ड्रेस',
      'Wash & Iron for Women Mini Skirts': 'धोकर प्रेस करें - महिला मिनी स्कर्ट',
      'Wash & Iron for Women Midi Skirts': 'धोकर प्रेस करें - महिला मिडी स्कर्ट',
      'Wash & Iron for Women Maxi Skirts': 'धोकर प्रेस करें - महिला मैक्सी स्कर्ट',
      'Wash & Iron for Women Leggings': 'धोकर प्रेस करें - महिला लेगिंग्स',
      'Wash & Iron for Women Jeggings': 'धोकर प्रेस करें - महिला जेगिंग्स',
      'Wash & Iron for Women Palazzos': 'धोकर प्रेस करें - महिला पलाज्जो',
      'Wash & Iron for Women Churidars': 'धोकर प्रेस करें - महिला चूड़ीदार',
      'Dry Clean for Women Blazers': 'ड्राई क्लीन करें - महिला ब्लेज़र',
      'Wash & Iron for Women Vests': 'धोकर प्रेस करें - महिला वेस्ट',
      'Wash & Iron for Women Underwear': 'धोकर प्रेस करें - महिला अंडरवियर',
      'Wash & Iron for Women Socks': 'धोकर प्रेस करें - महिला मोजे',
      
      // Children's service descriptions
      'Wash & Iron for Children T-Shirts': 'धोकर प्रेस करें - बच्चों की टी-शर्ट',
      'Wash & Iron for Children Shirts': 'धोकर प्रेस करें - बच्चों की शर्ट',
      'Wash & Iron for Children Tank Tops': 'धोकर प्रेस करें - बच्चों का टैंक टॉप',
      'Wash & Iron for Children Hoodies': 'धोकर प्रेस करें - बच्चों की हुडी',
      'Wash & Iron for Children Sweatshirts': 'धोकर प्रेस करें - बच्चों की स्वेटशर्ट',
      'Wash & Iron for Children Jeans': 'धोकर प्रेस करें - बच्चों की जींस',
      'Wash & Iron for Children Trousers': 'धोकर प्रेस करें - बच्चों की पैंट',
      'Wash & Iron for Children Shorts': 'धोकर प्रेस करें - बच्चों के शॉर्ट्स',
      'Wash & Iron for Children Track Pants': 'धोकर प्रेस करें - बच्चों की ट्रैक पैंट',
      'Wash & Iron for Children Dresses': 'धोकर प्रेस करें - बच्चों की ड्रेस',
      'Wash & Iron for Children Skirts': 'धोकर प्रेस करें - बच्चों की स्कर्ट',
      'Wash & Iron for Children Sweaters': 'धोकर प्रेस करें - बच्चों का स्वेटर',
      'Wash & Iron for Children Jackets': 'धोकर प्रेस करें - बच्चों की जैकेट',
      'Wash & Iron for Children Uniforms': 'धोकर प्रेस करें - बच्चों की यूनिफॉर्म',
      'Wash & Iron for Boy Shirts': 'धोकर प्रेस करें - लड़के की शर्ट',
      'Wash & Iron for Boy Shorts': 'धोकर प्रेस करें - लड़के के शॉर्ट्स',
      'Wash & Iron for Boy T-Shirts': 'धोकर प्रेस करें - लड़के की टी-शर्ट',
      'Wash & Iron for Boy Pants': 'धोकर प्रेस करें - लड़के की पैंट',
      'Wash & Iron for Girl Dresses': 'धोकर प्रेस करें - लड़की की ड्रेस',
      'Wash & Iron for Girl Skirts': 'धोकर प्रेस करें - लड़की की स्कर्ट',
      'Wash & Iron for Girl Tops': 'धोकर प्रेस करें - लड़की का टॉप',
      'Wash & Iron for Girl Frocks': 'धोकर प्रेस करें - लड़की का फ्रॉक'
    };
    
    return descriptionMap[description] || description;
  }
}
