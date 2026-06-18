const {
  useState,
  useEffect,
  useMemo
} = React;
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJdXBKq_CqyAKfEtDTirnyg_kWMX-bX3IQ1h8U6s5LyVpfKiNUUM3yGfA_QxTaE7Yw/exec";
const INITIAL_BALANCES = {
  "Прокофьева Н.В.": 109220.64,
  "Горбунов В. С.": -92098.00,
  "Залазаев В.В.": 14643.21
};
const CUTOFF_DATES = {
  "Прокофьева Н.В.": new Date(2026, 3, 30),
  "Горбунов В. С.": new Date(2026, 3, 30),
  "Залазаев В.В.": new Date(2026, 0, 1)
};
const USERS = {
  "dmitriev": {
    password: "DAN",
    name: "Дмитриев А.Н.",
    companies: ["Kedress"]
  },
  "zalazaev": {
    password: "ZVV",
    name: "Залазаев В.В.",
    companies: ["Палладиум"]
  },
  "kuzina": {
    password: "KEA",
    name: "Кузина Е. А.",
    companies: ["Kedress"]
  },
  "matvienko": {
    password: "MEV",
    name: "Матвиенко Е.В.",
    companies: ["Kedress"]
  },
  "prokofieva": {
    password: "PNV",
    name: "Прокофьева Н.В.",
    companies: ["Kedress"]
  },
  "silin": {
    password: "SAI",
    name: "Силин А. И.",
    companies: ["Kedress"]
  },
  "dolmatov": {
    password: "DYM",
    name: "Долматов Ю. М.",
    companies: ["Kedress", "Палладиум"]
  },
  "anohin": {
    password: "AVM",
    name: "Анохин В.М.",
    companies: ["Палладиум"]
  },
  "gorbunov": {
    password: "GVS",
    name: "Горбунов В. С.",
    companies: ["Палладиум"]
  },
  "kochetkov": {
    password: "KAS",
    name: "Кочетков А. С.",
    companies: ["Палладиум"]
  },
  "azizbaeva": {
    password: "AEA",
    name: "Азизбаева Е.А.",
    companies: ["Палладиум"]
  },
  "chintsov": {
    password: "CYA",
    name: "Чинцов Ю. А.",
    companies: ["Палладиум"]
  },
  "shepilov": {
    password: "SAN",
    name: "Шепилов А.Н.",
    companies: ["Палладиум"]
  }
};
const CATEGORIES = {
  "Kedress": ["Содержание ПК", "Вклады от собственников", "Прочая продажа неликвида", "Зарплата производственного персонала", "Зарплата охраны", "Зарплата административного персонала", "Содержание офиса", "Представительские расходы", "Обслуживание линии", "Оплаты по кредитам и займам", "Командировачные расходы", "Доставка", "Автомобиль", "Упаковка и тара"],
  "Палладиум": ["Услуга по перевозке", "Прочие поступления", "Транспортные услуги", "РКО", "Зарплата производственного персонала", "Зарплата водителей", "Зарплата административного персонала", "Зарплата коммерческого персонала", "Обучение персонала", "Расходы на персонал", "Командировочные расходы", "Представительские расходы", "Поиск и найм персонала", "Маркетинговые расходы", "Аудит", "Обслуживание ПК", "Содержание офиса", "Связь, интернет, почтовые расходы", "Обслуживание 1С, ЭДО, сайт", "Автомобиль", "Аренда ПК", "Коммунальные ПК"]
};
const LOGOS = {
  "Kedress": "https://i.yapx.ru/dPovS.png",
  "Палладиум": "https://i.yapx.ru/dPLra.png"
};
function App() {
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({
    id: '',
    pass: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const getToday = () => new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    id: null,
    date: getToday(),
    company: '',
    type: 'Расход',
    pay: 'Наличные',
    cat: '',
    sum: '',
    note: '',
    files: [],
    photoUrl: ''
  });
  const [msg, setMsg] = useState({
    text: '',
    type: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem('cash_user');
    if (saved && USERS[saved]) {
      const u = USERS[saved];
      setUser(u);
      setForm(f => ({
        ...f,
        company: u.companies[0]
      }));
      loadHistory();
    }
    setIsLoading(false);
  }, []);
  const loadHistory = async () => {
    setIsSyncing(true);
    try {
      const r = await fetch(GOOGLE_SCRIPT_URL);
      const data = await r.json();
      setHistory(data);
      const now = new Date();
      const currentMonthStr = `${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getFullYear()).slice(-2)}`;
      if (!selectedMonth) {
        setSelectedMonth(currentMonthStr);
      }
    } catch (e) {
      console.error(e);
    }
    setIsSyncing(false);
  };
  const calculatedBalances = useMemo(() => {
    const calc = name => {
      const start = INITIAL_BALANCES[name] || 0;
      const cutoffDate = CUTOFF_DATES[name] || new Date(2026, 0, 1);
      const ops = history.filter(tx => {
        if (tx.employeeName !== name || tx.paymentMethod !== "Наличные") return false;
        const [d, m, y] = tx.date.split('.');
        const txDate = new Date(2000 + parseInt(y), parseInt(m) - 1, parseInt(d));
        return txDate > cutoffDate;
      });
      const delta = ops.reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
      return start + delta;
    };
    return {
      "Прокофьева Н.В.": calc("Прокофьева Н.В."),
      "Горбунов В. С.": calc("Горбунов В. С."),
      "Залазаев В.В.": calc("Залазаев В.В.")
    };
  }, [history]);
  const monthTabs = useMemo(() => {
    const months = new Set();
    const now = new Date();
    months.add(`${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getFullYear()).slice(-2)}`);
    history.forEach(tx => {
      const p = tx.date.split('.');
      if (p.length === 3) months.add(`${p[1]}.${p[2]}`);
    });
    return Array.from(months).sort((a, b) => {
      const [m1, y1] = a.split('.');
      const [m2, y2] = b.split('.');
      const sortA = y1 + m1;
      const sortB = y2 + m2;
      return sortB.localeCompare(sortA);
    });
  }, [history]);
  const currentList = useMemo(() => {
    return history.filter(tx => {
      const matchUser = user.name === "Долматов Ю. М." || tx.employeeName === user.name;
      const matchMonth = tx.date.includes(`.${selectedMonth}`);
      return matchUser && matchMonth;
    });
  }, [history, selectedMonth, user]);
  const handleLogin = e => {
    e.preventDefault();
    const u = USERS[login.id];
    if (u && u.password === login.pass) {
      setUser(u);
      localStorage.setItem('cash_user', login.id);
      setForm(f => ({
        ...f,
        company: u.companies[0]
      }));
      loadHistory();
    } else {
      setMsg({
        text: 'Ошибка входа',
        type: 'err'
      });
    }
  };
  const handleFile = async e => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setMsg({
      text: 'Обработка файлов...',
      type: 'ok'
    });
    const promises = files.map(f => new Promise(res => {
      const r = new FileReader();
      r.onloadend = () => res({
        base64: r.result.split(',')[1],
        type: f.type,
        name: f.name
      });
      r.readAsDataURL(f);
    }));
    const res = await Promise.all(promises);
    setForm(f => ({
      ...f,
      files: res
    }));
    setMsg({
      text: '',
      type: ''
    });
  };
  const onSubmit = async e => {
    e.preventDefault();
    if (!form.cat || !form.sum || !form.note.trim()) return setMsg({
      text: 'Заполните поля',
      type: 'err'
    });
    setIsSubmitting(true);
    const payload = {
      ...form,
      employeeName: user.name,
      amount: form.type === 'Расход' ? -Math.abs(form.sum) : Math.abs(form.sum),
      paymentMethod: form.pay,
      comment: form.note,
      category: form.cat,
      files: form.files
    };
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setMsg({
        text: 'Успешно!',
        type: 'ok'
      });
      setForm(f => ({
        ...f,
        id: null,
        sum: '',
        note: '',
        cat: '',
        files: [],
        photoUrl: '',
        date: getToday()
      }));
      loadHistory();
    } catch (err) {
      setMsg({
        text: 'Ошибка сети',
        type: 'err'
      });
    }
    setIsSubmitting(false);
  };
  const edit = tx => {
    const [d, m, y] = tx.date.split('.');
    setForm({
      ...form,
      id: tx.id,
      date: `20${y}-${m}-${d}`,
      type: tx.amount < 0 ? 'Расход' : 'Приход',
      pay: tx.paymentMethod,
      cat: tx.category,
      sum: Math.abs(tx.amount),
      note: tx.comment,
      photoUrl: tx.photoUrl,
      files: []
    });
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    setMsg({
      text: 'Режим правки',
      type: 'err'
    });
  };
  if (isLoading) return React.createElement("div", {
    className: "h-screen flex items-center justify-center font-black text-slate-300 loading-pulse uppercase"
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...");
  if (!user) return React.createElement("div", {
    className: "min-h-screen flex items-center justify-center bg-slate-100 p-6"
  }, React.createElement("div", {
    className: "w-full max-w-sm bg-white p-8 rounded-3xl shadow-2xl"
  }, React.createElement("h1", {
    className: "text-2xl font-black text-center mb-8 uppercase text-slate-800"
  }, "\u041A\u0430\u0441\u0441\u0430"), React.createElement("form", {
    onSubmit: handleLogin,
    className: "space-y-4"
  }, React.createElement("select", {
    className: "w-full p-4 border rounded-2xl outline-none font-bold bg-slate-50",
    onChange: e => setLogin({
      ...login,
      id: e.target.value
    })
  }, React.createElement("option", {
    value: ""
  }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430"), Object.entries(USERS).map(([k, v]) => React.createElement("option", {
    key: k,
    value: k
  }, v.name))), React.createElement("input", {
    type: "password",
    placeholder: "\u041F\u0430\u0440\u043E\u043B\u044C",
    className: "w-full p-4 border rounded-2xl outline-none bg-slate-50",
    onChange: e => setLogin({
      ...login,
      pass: e.target.value
    })
  }), React.createElement("button", {
    className: "w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg uppercase tracking-widest"
  }, "\u0412\u043E\u0439\u0442\u0438"))));
  return React.createElement("div", {
    className: "max-w-7xl mx-auto p-4 md:p-10"
  }, React.createElement("div", {
    className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
  }, React.createElement("div", {
    className: "flex items-center gap-4"
  }, React.createElement("div", {
    className: "bg-white p-2 rounded-xl border h-14 w-14 flex items-center justify-center shadow-sm"
  }, React.createElement("img", {
    src: LOGOS[form.company] || LOGOS["Kedress"],
    className: "max-h-full object-contain"
  })), React.createElement("div", null, React.createElement("h1", {
    className: "text-xl font-black uppercase text-slate-800 leading-none tracking-tighter"
  }, "\u0424\u0438\u043D\u0430\u043D\u0441\u044B"), React.createElement("p", {
    className: "text-[10px] text-slate-400 font-bold uppercase mt-1"
  }, user.name))), React.createElement("div", {
    className: "flex flex-wrap gap-2"
  }, (user.name === "Прокофьева Н.В." || user.name === "Долматов Ю. М.") && React.createElement("div", {
    className: "bg-white px-4 py-2 rounded-2xl border border-blue-50 shadow-sm"
  }, React.createElement("p", {
    className: "text-[8px] font-black text-slate-400 uppercase"
  }, "\u041E\u0441\u0442\u0430\u0442\u043E\u043A \u041F\u0440\u043E\u043A\u043E\u0444\u044C\u0435\u0432\u0430"), React.createElement("p", {
    className: `text-sm font-black ${calculatedBalances["Прокофьева Н.В."] < 0 ? 'text-red-600' : 'text-blue-600'}`
  }, calculatedBalances["Прокофьева Н.В."].toLocaleString('ru-RU'), " \u20BD")), (user.name === "Горбунов В. С." || user.name === "Долматов Ю. М.") && React.createElement("div", {
    className: "bg-white px-4 py-2 rounded-2xl border border-blue-50 shadow-sm"
  }, React.createElement("p", {
    className: "text-[8px] font-black text-slate-400 uppercase"
  }, "\u041E\u0441\u0442\u0430\u0442\u043E\u043A \u0413\u043E\u0440\u0431\u0443\u043D\u043E\u0432"), React.createElement("p", {
    className: `text-sm font-black ${calculatedBalances["Горбунов В. С."] < 0 ? 'text-red-600' : 'text-blue-600'}`
  }, calculatedBalances["Горбунов В. С."].toLocaleString('ru-RU'), " \u20BD")), (user.name === "Залазаев В.В." || user.name === "Долматов Ю. М.") && React.createElement("div", {
    className: "bg-white px-4 py-2 rounded-2xl border border-blue-50 shadow-sm"
  }, React.createElement("p", {
    className: "text-[8px] font-black text-slate-400 uppercase"
  }, "\u041E\u0441\u0442\u0430\u0442\u043E\u043A \u0417\u0430\u043B\u0430\u0437\u0430\u0435\u0432"), React.createElement("p", {
    className: `text-sm font-black ${calculatedBalances["Залазаев В.В."] < 0 ? 'text-red-600' : 'text-blue-600'}`
  }, calculatedBalances["Залазаев В.В."].toLocaleString('ru-RU'), " \u20BD")), React.createElement("button", {
    onClick: () => {
      localStorage.clear();
      location.reload();
    },
    className: "text-[10px] font-black text-slate-300 hover:text-red-500 uppercase px-2 transition-colors"
  }, "\u0412\u044B\u0445\u043E\u0434"))), React.createElement("div", {
    className: "grid grid-cols-1 lg:grid-cols-12 gap-8"
  }, React.createElement("div", {
    className: "lg:col-span-4"
  }, React.createElement("form", {
    onSubmit: onSubmit,
    className: "bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4 sticky top-6"
  }, React.createElement("div", {
    className: "flex justify-between items-center px-1"
  }, React.createElement("input", {
    type: "date",
    value: form.date,
    onChange: e => setForm({
      ...form,
      date: e.target.value
    }),
    className: "bg-slate-50 p-2 rounded-xl font-bold text-xs outline-none"
  }), form.id && React.createElement("span", {
    className: "bg-amber-100 text-amber-600 text-[9px] font-black px-3 py-1 rounded-full uppercase animate-pulse"
  }, "\u041F\u0440\u0430\u0432\u043A\u0430")), React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, ['Приход', 'Расход'].map(t => React.createElement("button", {
    key: t,
    type: "button",
    onClick: () => setForm({
      ...form,
      type: t
    }),
    className: `py-3 rounded-2xl font-black text-xs transition-all border-2 ${form.type === t ? t === 'Приход' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700' : 'border-slate-50 text-slate-300'}`
  }, t.toUpperCase()))), React.createElement("div", {
    className: "bg-slate-100 p-1 rounded-2xl grid grid-cols-2 gap-1"
  }, ['Наличные', 'Карта банка'].map(p => React.createElement("button", {
    key: p,
    type: "button",
    onClick: () => setForm({
      ...form,
      pay: p
    }),
    className: `py-2 rounded-xl text-[9px] font-black uppercase transition-all ${form.pay === p ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`
  }, p))), React.createElement("div", {
    className: "space-y-3"
  }, React.createElement("select", {
    value: form.company,
    onChange: e => setForm({
      ...form,
      company: e.target.value,
      cat: ''
    }),
    className: "w-full p-3 border border-slate-100 rounded-xl font-bold text-sm outline-none bg-white"
  }, user.companies.map(c => React.createElement("option", {
    key: c,
    value: c
  }, c))), React.createElement("select", {
    value: form.cat,
    onChange: e => setForm({
      ...form,
      cat: e.target.value
    }),
    className: "w-full p-3 border border-slate-100 rounded-xl text-sm outline-none bg-white font-medium"
  }, React.createElement("option", {
    value: ""
  }, "\u0421\u0442\u0430\u0442\u044C\u044F..."), CATEGORIES[form.company]?.map(cat => React.createElement("option", {
    key: cat,
    value: cat
  }, cat))), React.createElement("div", {
    className: "relative"
  }, React.createElement("input", {
    type: "number",
    value: form.sum,
    onChange: e => setForm({
      ...form,
      sum: e.target.value
    }),
    placeholder: "0.00",
    className: "w-full p-3 border border-slate-100 rounded-xl outline-none font-black text-xl"
  }), React.createElement("span", {
    className: "absolute right-4 top-3.5 font-black text-slate-200 text-xl"
  }, "\u20BD")), React.createElement("textarea", {
    value: form.note,
    onChange: e => setForm({
      ...form,
      note: e.target.value
    }),
    placeholder: "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439...",
    className: "w-full p-3 border border-slate-100 rounded-xl h-24 outline-none text-sm resize-none"
  }), React.createElement("label", {
    className: "flex items-center justify-center p-4 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all"
  }, React.createElement("span", {
    className: "text-[10px] text-slate-400 font-black uppercase text-center"
  }, form.files.length > 0 ? `📎 Файлов: ${form.files.length}` : form.photoUrl && form.photoUrl !== "Без фото" ? '📎 Файлы сохранены' : '📷 Прикрепить документы'), React.createElement("input", {
    type: "file",
    multiple: true,
    className: "hidden",
    onChange: handleFile
  }))), msg.text && React.createElement("p", {
    className: `text-[10px] font-black uppercase text-center p-2 rounded-lg ${msg.type === 'ok' ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`
  }, msg.text), React.createElement("button", {
    disabled: isSubmitting,
    className: "w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all disabled:opacity-50 shadow-xl uppercase tracking-tighter"
  }, isSubmitting ? 'ЗАГРУЗКА...' : form.id ? 'ОБНОВИТЬ' : 'СОХРАНИТЬ'))), React.createElement("div", {
    className: "lg:col-span-8 flex flex-col md:flex-row gap-6"
  }, React.createElement("div", {
    className: "md:w-32 flex md:flex-col overflow-x-auto md:overflow-x-visible gap-2 pb-2 md:pb-0 custom-scrollbar shrink-0"
  }, React.createElement("p", {
    className: "hidden md:block text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2 px-2"
  }, "\u041F\u0435\u0440\u0438\u043E\u0434"), monthTabs.map(m => React.createElement("button", {
    key: m,
    onClick: () => setSelectedMonth(m),
    className: `px-4 py-3 rounded-2xl border text-[10px] font-black transition-all whitespace-nowrap ${selectedMonth === m ? 'active-tab' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'}`
  }, m))), React.createElement("div", {
    className: "flex-1 space-y-4 max-h-[850px] overflow-y-auto pr-2 custom-scrollbar"
  }, React.createElement("div", {
    className: "flex justify-between items-center px-1 sticky top-0 bg-slate-50/80 backdrop-blur-sm py-2 z-10"
  }, React.createElement("h2", {
    className: "font-black text-[10px] text-slate-300 uppercase tracking-widest"
  }, "\u041E\u043F\u0435\u0440\u0430\u0446\u0438\u0438 \u0437\u0430 ", selectedMonth), isSyncing && React.createElement("div", {
    className: "text-[8px] font-black text-blue-400 loading-pulse uppercase"
  }, "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435...")), currentList.map(tx => React.createElement("div", {
    key: tx.id,
    className: "bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex justify-between items-start hover:border-blue-100 transition-colors"
  }, React.createElement("div", {
    className: "space-y-1 w-full"
  }, React.createElement("div", {
    className: "flex items-center gap-2 mb-1"
  }, React.createElement("span", {
    className: `text-[8px] font-black px-2 py-0.5 rounded uppercase ${tx.amount < 0 ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`
  }, tx.amount < 0 ? 'Расход' : 'Приход'), React.createElement("span", {
    className: "text-[8px] font-black text-slate-400"
  }, tx.date), React.createElement("span", {
    className: "text-[8px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded uppercase"
  }, tx.paymentMethod)), React.createElement("p", {
    className: "font-black text-slate-800 text-2xl tracking-tighter"
  }, Math.abs(tx.amount).toLocaleString('ru-RU'), " \u20BD"), React.createElement("p", {
    className: "text-[10px] font-bold text-slate-400 uppercase tracking-tight"
  }, tx.category, " ", user.name === "Долматов Ю. М." && React.createElement("span", {
    className: "text-blue-300 ml-1"
  }, "| ", tx.employeeName)), React.createElement("div", {
    className: "bg-slate-50 p-3 rounded-xl mt-3 border-l-4 border-slate-200"
  }, React.createElement("p", {
    className: "text-[13px] text-slate-600 italic leading-relaxed font-medium"
  }, "\"", tx.comment, "\"")), tx.photoUrl && tx.photoUrl !== "Без фото" && React.createElement("div", {
    className: "flex flex-wrap gap-2 mt-3"
  }, tx.photoUrl.split(',').map((url, idx) => React.createElement("a", {
    key: idx,
    href: url.trim(),
    target: "_blank",
    rel: "noopener noreferrer",
    className: "inline-block text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-1 rounded-md hover:bg-blue-100 transition-colors uppercase"
  }, "\uD83D\uDCCE \u0424\u0430\u0439\u043B ", idx + 1)))), React.createElement("button", {
    onClick: () => edit(tx),
    className: "p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-2xl transition-all shadow-sm ml-2"
  }, React.createElement("svg", {
    className: "w-4 h-4",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: "3"
  }, React.createElement("path", {
    d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
  }))))), currentList.length === 0 && !isSyncing && React.createElement("div", {
    className: "text-center py-20 text-slate-200 font-black uppercase text-xs"
  }, "\u0417\u0430\u043F\u0438\u0441\u0435\u0439 \u043D\u0435\u0442")))));
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App, null));
