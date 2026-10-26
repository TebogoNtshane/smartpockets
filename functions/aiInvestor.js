export default async function aiInvestor({ question, result, language = "en", history = [] }) {
  const q = (question || "").toLowerCase();
  
  let answer = "";

  if (q.includes("hi") || q.includes("hii") || q.includes("hello") || q.includes("sawubona") || q.includes("dumela")) {
    answer = language === 'zu' ? "Sawubona! Ngingumeluleki wakho wezimali. Ungabuza noma yini nge-credit, loan, investment, noma uhlelo lwakho." : 
             language === 'st' ? "Dumela! Ke moeletsi wa hao wa ditjhelete. O ka botsa ka credit, loan, kapa moralo wa hao." :
             "Hi! I'm your AI Investor. Ask me anything about credit, loans, your investment plan, or how to grow your money in SA.";
  } 
  else if (q.includes("credit")) {
    answer = "Credit = money you borrow now and pay back later + interest. Example: You use R500 credit to buy airtime, you pay R550 next month. Good credit history helps you get loans.";
  }
  else if (q.includes("loan")) {
    answer = "Loan = Bank gives you a lump sum now (e.g. R10k), you repay fixed monthly amounts with interest. Unlike credit which is revolving, a loan has an end date.";
  }
  else if (q.includes("invest") || result) {
    answer = result 
      ? `For your plan: You invest R${result.amount} for ${result.horizon_years} years. I suggest ${result.weights?.map(w=>`${w.label} ${Math.round(w.weight*100)}%`).join(", ")}. This gives you about ${result.expected_return} return with ${result.volatility} risk.`
      : "Investing = putting money in assets like EasyEquities, Satrix ETFs, or Money Market to grow over time. Start with R100/month in a TFSA.";
  }
  else {
    answer = `You asked: "${question}". Here's a simple SA explanation: This is about managing money wisely. Keep 3 months expenses in savings, avoid 30%+ interest debt, and invest monthly in low-cost ETFs. Want me to explain in Zulu/Sotho?`;
  }

  return { answer };
}