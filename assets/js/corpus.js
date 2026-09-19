/*
 * Message bank.
 *
 * The samples are written in the shape these messages actually arrive in
 * India: mixed Hindi and English, bad spacing, a real-looking sender name.
 * Nothing here is copied from a real victim's phone.
 */

/** One-tap samples on the scanner. */
export const SAMPLES = [
  {
    label: 'KYC expiry',
    text: `Dear Customer, your SBI YONO account will be BLOCKED today as your KYC is expired. Update immediately to avoid deactivation: http://sbi-kyc-update.xyz/verify
Failure to update within 24 hours will result in permanent suspension.`,
  },
  {
    label: 'Digital arrest call',
    text: `Sir this is Inspector R. K. Sharma, Cyber Crime Mumbai. A parcel in your name contains illegal items and an FIR has been registered against you. You are under digital arrest. Do not disconnect this call and do not tell anyone in your family. Keep your camera on. To verify your innocence deposit Rs 45000 in the RBI verification account, it is fully refundable after clearance.`,
  },
  {
    label: 'Easy income',
    text: `Hello! Part time job from home. Just like YouTube videos and earn 3000 daily. No experience needed, no investment. Join our telegram group: t.me/earnfast_india
First task payment in 30 mins!!`,
  },
  {
    label: 'Real bank alert',
    text: `Rs.2,340.00 debited from A/c XX4417 on 18-09-26 to SWIGGY via UPI. Not you? Call 1800 111 109. Never share your OTP or PIN with anyone. -SBI`,
  },
  {
    label: 'Lottery win',
    text: `CONGRATULATIONS!! Your mobile number has won Rs 25,00,000 in the KBC Lucky Draw 2026. To claim your prize pay refundable processing fee of Rs 5,500 on this UPI id winner.kbc@okaxis and send screenshot on WhatsApp 9812345670.`,
  },
  {
    label: 'Electricity cut',
    text: `Dear consumer your electricity will be disconnected tonight at 9:30 PM because your previous month bill was not updated. Please contact our electricity officer immediately 7896541230.`,
  },
];

/**
 * Practice mode.
 * `scam: false` items are deliberately realistic so the drill is not trivial.
 */
export const DRILL = [
  {
    text: `Your Amazon order #402-8873 is out for delivery and will arrive today between 4 PM and 8 PM. Track in the app.`,
    scam: false,
    from: 'AX-AMZNIN',
    tell: {
      en: 'Informs and asks for nothing. No link, no payment, no urgency.',
      hi: 'सिर्फ़ जानकारी देता है — न लिंक, न पैसे, न जल्दबाज़ी।',
    },
  },
  {
    text: `Dear user, your Amazon parcel is stuck at customs. Pay clearance charge of Rs 299 here to release it: bit.ly/amzn-clear`,
    scam: true,
    from: '+91 70XXXX8821',
    tell: {
      en: 'A small payment on a shortened link. Couriers collect dues at the door or in their own app, never through a link in an SMS.',
      hi: 'शॉर्ट लिंक पर छोटी सी पेमेंट। कूरियर पैसे दरवाज़े पर या अपने ऐप में लेता है, SMS के लिंक से कभी नहीं।',
    },
  },
  {
    text: `Aapka bijli connection aaj raat 9:30 baje kaat diya jayega. Turant hamare officer se baat kare 9876543210 -Electricity Board`,
    scam: true,
    from: 'BZ-ELECBD',
    tell: {
      en: 'Deadline plus a personal mobile number. Boards send a bill, not a midnight ultimatum from a 10-digit number.',
      hi: 'डेडलाइन और साथ में निजी मोबाइल नंबर। बोर्ड बिल भेजता है, 10 अंकों के नंबर से आधी रात की धमकी नहीं।',
    },
  },
  {
    text: `OTP 448190 for your HDFC Bank NetBanking login. Valid 10 min. Never share this OTP with anyone, including bank staff.`,
    scam: false,
    from: 'VM-HDFCBK',
    tell: {
      en: 'The OTP is delivered to you and the message asks for nothing back. If you did not trigger it, ignore it and change your password.',
      hi: 'OTP आपको दिया जा रहा है, बदले में कुछ माँगा नहीं गया। अगर आपने लॉगिन नहीं किया तो इसे अनदेखा करें और पासवर्ड बदलें।',
    },
  },
  {
    text: `Sir main aapke office se bol raha hoon, urgent meeting hai. Main abhi call nahi kar sakta. Kya aap mere liye 5 Amazon gift cards le sakte ho? Paise shaam tak return kar dunga. Kisi ko batane ki zarurat nahi.`,
    scam: true,
    from: '+91 98XXXX4410',
    tell: {
      en: 'Boss impersonation: cannot talk, needs gift cards, wants it kept quiet. Every one of those three is a move from the script.',
      hi: 'बॉस बनकर ठगी: बात नहीं कर सकते, गिफ़्ट कार्ड चाहिए, और किसी को बताना नहीं। ये तीनों बातें स्क्रिप्ट का हिस्सा हैं।',
    },
  },
  {
    text: `Congratulations! You are selected for Work From Home data entry, salary 25000/month. Registration fee only Rs 750 refundable. Reply YES to confirm seat.`,
    scam: true,
    from: 'TX-JOBHUB',
    tell: {
      en: 'A job you never applied for, and a fee to start. Real employers pay you, not the other way round.',
      hi: 'जिस नौकरी में आवेदन ही नहीं किया, उसके लिए फ़ीस। असली नियोक्ता पैसे देता है, लेता नहीं।',
    },
  },
  {
    text: `Reminder: your LIC policy 3487122 premium of Rs 18,450 is due on 28-09-2026. Pay through the LIC app or your branch.`,
    scam: false,
    from: 'AD-LICIND',
    tell: {
      en: 'Names your policy number and points you to the official app or branch instead of a link.',
      hi: 'आपका पॉलिसी नंबर लिखा है और किसी लिंक के बजाय आधिकारिक ऐप या ब्रांच पर भेजा गया है।',
    },
  },
  {
    text: `This is Income Tax Department. Your PAN is linked to a money laundering case. A non-bailable warrant is issued. Download this app for verification and stay on the call. Do not inform anyone, it is a confidential investigation.`,
    scam: true,
    from: '+91 89XXXX7702',
    tell: {
      en: 'Fear, secrecy and an app install in one message. No department investigates you over a phone call.',
      hi: 'डर, गोपनीयता और ऐप इंस्टॉल — एक ही मैसेज में। कोई विभाग फ़ोन कॉल पर जाँच नहीं करता।',
    },
  },
  {
    text: `Hi, main Neha. Sorry galat number lag gaya. Waise aap kya karte ho? Main crypto trading karti hu, achha profit ho raha hai aaj kal.`,
    scam: true,
    from: '+91 63XXXX1195',
    tell: {
      en: 'The wrong-number opener. Friendly chat first, an investment app a week later. This is how pig-butchering starts.',
      hi: '"ग़लत नंबर" वाली शुरुआत। पहले दोस्ती, हफ़्ते भर बाद इन्वेस्टमेंट ऐप। ठगी का यही तरीक़ा है।',
    },
  },
  {
    text: `Your electricity bill of Rs 1,247 for August is now available. Due date 25-09-2026. View and pay in the discom app or at any CSC centre.`,
    scam: false,
    from: 'JD-BSESDL',
    tell: {
      en: 'Gives an amount, a month and a normal due date, and sends you to official channels.',
      hi: 'रक़म, महीना और सामान्य तारीख़ बताई गई है, और आधिकारिक माध्यम पर भेजा गया है।',
    },
  },
];
