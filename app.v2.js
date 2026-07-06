const {
  useEffect,
  useMemo,
  useState
} = React;
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJdXBKq_CqyAKfEtDTirnyg_kWMX-bX3IQ1h8U6s5LyVpfKiNUUM3yGfA_QxTaE7Yw/exec";
const INITIAL_BALANCES = {
  "Прокофьева Н.В.": 109220.64,
  "Горбунов В. С.": -92098.0,
  "Залазаев В.В.": 14643.21,
  "Иванов И.Н.": 50000.0
};
const CUTOFF_DATES = {
  "Прокофьева Н.В.": new Date(2026, 3, 30),
  "Горбунов В. С.": new Date(2026, 3, 30),
  "Залазаев В.В.": new Date(2026, 0, 1),
  "Иванов И.Н.": new Date(2026, 0, 1)
};
const USERS = {
  dmitriev: {
    password: "DAN",
    name: "Дмитриев А.Н.",
    companies: ["Kedress"]
  },
  zalazaev: {
    password: "ZVV",
    name: "Залазаев В.В.",
    companies: ["Палладиум"]
  },
  ivanov: {
    password: "IIN",
    name: "Иванов И.Н.",
    companies: ["Kedress", "Палладиум"]
  },
  kuzina: {
    password: "KEA",
    name: "Кузина Е. А.",
    companies: ["Kedress"]
  },
  matvienko: {
    password: "MEV",
    name: "Матвиенко Е.В.",
    companies: ["Kedress"]
  },
  prokofieva: {
    password: "PNV",
    name: "Прокофьева Н.В.",
    companies: ["Kedress"]
  },
  silin: {
    password: "SAI",
    name: "Силин А. И.",
    companies: ["Kedress"]
  },
  dolmatov: {
    password: "DYM",
    name: "Долматов Ю. М.",
    companies: ["Kedress", "Палладиум"]
  },
  anohin: {
    password: "AVM",
    name: "Анохин В.М.",
    companies: ["Палладиум"]
  },
  gorbunov: {
    password: "GVS",
    name: "Горбунов В. С.",
    companies: ["Палладиум"]
  },
  kochetkov: {
    password: "KAS",
    name: "Кочетков А. С.",
    companies: ["Палладиум"]
  },
  azizbaeva: {
    password: "AEA",
    name: "Азизбаева Е.А.",
    companies: ["Палладиум"]
  },
  chintsov: {
    password: "CYA",
    name: "Чинцов Ю. А.",
    companies: ["Палладиум"]
  },
  shepilov: {
    password: "SAN",
    name: "Шепилов А.Н.",
    companies: ["Палладиум"]
  }
};
const CATEGORIES = {
  Kedress: ["Содержание ПК", "Вклады от собственников", "Прочая продажа неликвида", "Зарплата производственного персонала", "Зарплата охраны", "Зарплата административного персонала", "Содержание офиса", "Представительские расходы", "Обслуживание линии", "Оплаты по кредитам и займам", "Командировачные расходы", "Доставка", "Автомобиль", "Упаковка и тара"],
  "Палладиум": ["Услуга по перевозке", "Прочие поступления", "Транспортные услуги", "РКО", "Зарплата производственного персонала", "Зарплата водителей", "Зарплата административного персонала", "Зарплата коммерческого персонала", "Обучение персонала", "Расходы на персонал", "Командировочные расходы", "Представительские расходы", "Поиск и найм персонала", "Маркетинговые расходы", "Аудит", "Обслуживание ПК", "Содержание офиса", "Связь, интернет, почтовые расходы", "Обслуживание 1С, ЭДО, сайт", "Автомобиль", "Аренда ПК", "Коммунальные ПК"]
};
const LOGOS = {
  Kedress: "https://i.yapx.ru/dPovS.png",
  "Палладиум": "https://i.yapx.ru/dPLra.png"
};
const formatAmount = value => Number(value || 0).toLocaleString("ru-RU");
const getToday = () => new Date().toISOString().split("T")[0];
const getMonthLabel = date => `${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getFullYear()).slice(-2)}`;
function App() {
  const [user, setUser] = useState(null);
  const [login, setLogin] = useState({
    id: "",
    pass: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState({
    text: "",
    type: ""
  });
  const [form, setForm] = useState({
    id: null,
    date: getToday(),
    company: "",
    type: "Расход",
    pay: "Наличные",
    cat: "",
    sum: "",
    note: "",
    files: [],
    photoUrl: ""
  });
  useEffect(() => {
    const saved = localStorage.getItem("cash_user");
    if (saved && USERS[saved]) {
      const currentUser = USERS[saved];
      setUser(currentUser);
      setForm(prev => ({
        ...prev,
        company: currentUser.companies[0]
      }));
      void loadHistory();
    }
    setIsLoading(false);
  }, []);
  async function loadHistory() {
    setIsSyncing(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const data = await response.json();
      setHistory(data);
      if (!selectedMonth) {
        setSelectedMonth(getMonthLabel(new Date()));
      }
    } catch (error) {
      console.error(error);
    }
    setIsSyncing(false);
  }
  const calculatedBalances = useMemo(() => {
    const calculateFor = name => {
      const start = INITIAL_BALANCES[name] || 0;
      const cutoffDate = CUTOFF_DATES[name] || new Date(2026, 0, 1);
      const operations = history.filter(tx => {
        if (tx.employeeName !== name || tx.paymentMethod !== "Наличные") {
          return false;
        }
        const [day, month, year] = tx.date.split(".");
        const txDate = new Date(2000 + parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        return txDate > cutoffDate;
      });
      const delta = operations.reduce((acc, tx) => acc + parseFloat(tx.amount), 0);
      return start + delta;
    };
    return {
      "Прокофьева Н.В.": calculateFor("Прокофьева Н.В."),
      "Горбунов В. С.": calculateFor("Горбунов В. С."),
      "Залазаев В.В.": calculateFor("Залазаев В.В."),
      "Иванов И.Н.": calculateFor("Иванов И.Н.")
    };
  }, [history]);
  const monthTabs = useMemo(() => {
    const months = new Set([getMonthLabel(new Date())]);
    history.forEach(tx => {
      const parts = tx.date.split(".");
      if (parts.length === 3) {
        months.add(`${parts[1]}.${parts[2]}`);
      }
    });
    return Array.from(months).sort((a, b) => {
      const [monthA, yearA] = a.split(".");
      const [monthB, yearB] = b.split(".");
      return `${yearB}${monthB}`.localeCompare(`${yearA}${monthA}`);
    });
  }, [history]);
  const currentList = useMemo(() => {
    if (!user) {
      return [];
    }
    return history.filter(tx => {
      const matchUser = user.name === "Долматов Ю. М." || tx.employeeName === user.name;
      const matchMonth = tx.date.includes(`.${selectedMonth}`);
      return matchUser && matchMonth;
    });
  }, [history, selectedMonth, user]);
  const visibleBalanceCards = useMemo(() => {
    if (!user) {
      return [];
    }
    return [{
      key: "Прокофьева Н.В.",
      label: "Остаток Прокофьева",
      show: user.name === "Прокофьева Н.В." || user.name === "Долматов Ю. М."
    }, {
      key: "Горбунов В. С.",
      label: "Остаток Горбунов",
      show: user.name === "Горбунов В. С." || user.name === "Долматов Ю. М."
    }, {
      key: "Залазаев В.В.",
      label: "Остаток Залазаев",
      show: user.name === "Залазаев В.В." || user.name === "Долматов Ю. М."
    }, {
      key: "Иванов И.Н.",
      label: "Остаток Иванов",
      show: user.name === "Иванов И.Н." || user.name === "Долматов Ю. М."
    }].filter(item => item.show);
  }, [user]);
  const logoCompany = form.company || user?.companies?.[0] || "Kedress";
  const handleLogin = event => {
    event.preventDefault();
    const currentUser = USERS[login.id];
    if (currentUser && currentUser.password === login.pass) {
      setUser(currentUser);
      localStorage.setItem("cash_user", login.id);
      setForm(prev => ({
        ...prev,
        company: currentUser.companies[0]
      }));
      void loadHistory();
      setMsg({
        text: "",
        type: ""
      });
    } else {
      setMsg({
        text: "Ошибка входа",
        type: "err"
      });
    }
  };
  const handleFile = async event => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) {
      return;
    }
    setMsg({
      text: "Обработка файлов...",
      type: "ok"
    });
    const convertedFiles = await Promise.all(files.map(file => new Promise(resolve => {
      const reader = new FileReader();
      reader.onloadend = () => resolve({
        base64: reader.result.split(",")[1],
        type: file.type,
        name: file.name
      });
      reader.readAsDataURL(file);
    })));
    setForm(prev => ({
      ...prev,
      files: convertedFiles
    }));
    setMsg({
      text: "",
      type: ""
    });
  };
  const onSubmit = async event => {
    event.preventDefault();
    if (!form.cat || !form.sum || !form.note.trim()) {
      setMsg({
        text: "Заполните поля",
        type: "err"
      });
      return;
    }
    setIsSubmitting(true);
    const payload = {
      ...form,
      employeeName: user.name,
      amount: form.type === "Расход" ? -Math.abs(form.sum) : Math.abs(form.sum),
      paymentMethod: form.pay,
      comment: form.note,
      category: form.cat,
      files: form.files
    };
    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      setMsg({
        text: "Успешно!",
        type: "ok"
      });
      setForm(prev => ({
        ...prev,
        id: null,
        sum: "",
        note: "",
        cat: "",
        files: [],
        photoUrl: "",
        date: getToday()
      }));
      void loadHistory();
    } catch (error) {
      setMsg({
        text: "Ошибка сети",
        type: "err"
      });
    }
    setIsSubmitting(false);
  };
  const edit = tx => {
    const [day, month, year] = tx.date.split(".");
    setForm(prev => ({
      ...prev,
      id: tx.id,
      date: `20${year}-${month}-${day}`,
      type: tx.amount < 0 ? "Расход" : "Приход",
      pay: tx.paymentMethod,
      cat: tx.category,
      sum: Math.abs(tx.amount),
      note: tx.comment,
      photoUrl: tx.photoUrl,
      files: []
    }));
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
    setMsg({
      text: "Режим правки",
      type: "err"
    });
  };
  if (isLoading) {
    return React.createElement("div", {
      className: "cash-shell cash-shell--loading"
    }, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...");
  }
  if (!user) {
    return React.createElement("div", {
      className: "cash-shell"
    }, React.createElement("div", {
      className: "cash-login-card"
    }, React.createElement("div", {
      className: "cash-login-brand"
    }, "\u041A\u0410\u0421\u0421\u0410"), React.createElement("form", {
      className: "cash-login-form",
      onSubmit: handleLogin
    }, React.createElement("label", {
      className: "cash-field-label",
      htmlFor: "employee"
    }, "\u0421\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A"), React.createElement("select", {
      id: "employee",
      name: "employee",
      className: "cash-control cash-control--select",
      value: login.id,
      onChange: event => setLogin({
        ...login,
        id: event.target.value
      })
    }, React.createElement("option", {
      value: ""
    }, "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0441\u043E\u0442\u0440\u0443\u0434\u043D\u0438\u043A\u0430"), Object.entries(USERS).map(([key, value]) => React.createElement("option", {
      key: key,
      value: key
    }, value.name))), React.createElement("label", {
      className: "cash-field-label",
      htmlFor: "password"
    }, "\u041F\u0430\u0440\u043E\u043B\u044C"), React.createElement("input", {
      id: "password",
      name: "password",
      type: "password",
      autoComplete: "current-password",
      className: "cash-control",
      placeholder: "\u041F\u0430\u0440\u043E\u043B\u044C",
      value: login.pass,
      onChange: event => setLogin({
        ...login,
        pass: event.target.value
      })
    }), msg.text ? React.createElement("div", {
      className: `cash-message cash-message--${msg.type === "ok" ? "ok" : "error"}`
    }, msg.text) : null, React.createElement("button", {
      className: "cash-primary-button cash-primary-button--login",
      type: "submit"
    }, "\u0412\u041E\u0419\u0422\u0418"))));
  }
  return React.createElement("div", {
    className: "cash-shell"
  }, React.createElement("div", {
    className: "cash-app"
  }, React.createElement("header", {
    className: "cash-topbar"
  }, React.createElement("div", {
    className: "cash-brand"
  }, React.createElement("div", {
    className: "cash-brand-logo"
  }, React.createElement("img", {
    alt: logoCompany,
    src: LOGOS[logoCompany] || LOGOS.Kedress
  })), React.createElement("div", {
    className: "cash-brand-copy"
  }, React.createElement("h1", null, "\u0424\u0418\u041D\u0410\u041D\u0421\u042B"), React.createElement("p", null, user.name))), React.createElement("div", {
    className: "cash-topbar-right"
  }, React.createElement("div", {
    className: "cash-balance-strip"
  }, visibleBalanceCards.map(item => {
    const value = calculatedBalances[item.key];
    return React.createElement("div", {
      className: "cash-balance-card",
      key: item.key
    }, React.createElement("span", null, item.label), React.createElement("strong", {
      className: value < 0 ? "is-negative" : "is-positive"
    }, formatAmount(value), " \u20BD"));
  })), React.createElement("button", {
    className: "cash-exit-button",
    type: "button",
    onClick: () => {
      localStorage.clear();
      location.reload();
    }
  }, "\u0412\u042B\u0425\u041E\u0414"))), React.createElement("div", {
    className: "cash-content-grid"
  }, React.createElement("section", {
    className: "cash-form-panel"
  }, React.createElement("form", {
    className: "cash-form-card",
    onSubmit: onSubmit
  }, React.createElement("div", {
    className: "cash-form-header"
  }, React.createElement("div", {
    className: "cash-date-pill"
  }, React.createElement("input", {
    className: "cash-date-input",
    type: "date",
    name: "operation_date",
    value: form.date,
    onChange: event => setForm({
      ...form,
      date: event.target.value
    })
  })), form.id ? React.createElement("span", {
    className: "cash-edit-badge"
  }, "\u0420\u0415\u0416\u0418\u041C \u041F\u0420\u0410\u0412\u041A\u0418") : null), React.createElement("div", {
    className: "cash-toggle-grid"
  }, ["Приход", "Расход"].map(type => React.createElement("button", {
    key: type,
    type: "button",
    className: `cash-toggle cash-toggle--type ${form.type === type ? `is-active is-${type === "Приход" ? "income" : "expense"}` : ""}`,
    onClick: () => setForm({
      ...form,
      type
    })
  }, type))), React.createElement("div", {
    className: "cash-toggle-grid cash-toggle-grid--soft"
  }, ["Наличные", "Карта банка"].map(payType => React.createElement("button", {
    key: payType,
    type: "button",
    className: `cash-toggle cash-toggle--pay ${form.pay === payType ? "is-active is-neutral" : ""}`,
    onClick: () => setForm({
      ...form,
      pay: payType
    })
  }, payType))), React.createElement("div", {
    className: "cash-form-fields"
  }, React.createElement("select", {
    className: "cash-control cash-control--select",
    name: "company",
    value: form.company,
    onChange: event => setForm({
      ...form,
      company: event.target.value,
      cat: ""
    })
  }, user.companies.map(company => React.createElement("option", {
    key: company,
    value: company
  }, company))), React.createElement("select", {
    className: "cash-control cash-control--select",
    name: "category",
    value: form.cat,
    onChange: event => setForm({
      ...form,
      cat: event.target.value
    })
  }, React.createElement("option", {
    value: ""
  }, "\u0421\u0442\u0430\u0442\u044C\u044F..."), CATEGORIES[form.company]?.map(category => React.createElement("option", {
    key: category,
    value: category
  }, category))), React.createElement("div", {
    className: "cash-money-input"
  }, React.createElement("input", {
    className: "cash-control cash-control--money",
    type: "number",
    name: "amount",
    placeholder: "0.00",
    value: form.sum,
    onChange: event => setForm({
      ...form,
      sum: event.target.value
    })
  }), React.createElement("span", null, "\u20BD")), React.createElement("textarea", {
    className: "cash-control cash-control--textarea",
    name: "comment",
    placeholder: "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439...",
    value: form.note,
    onChange: event => setForm({
      ...form,
      note: event.target.value
    })
  }), React.createElement("label", {
    className: "cash-upload",
    htmlFor: "files"
  }, React.createElement("input", {
    id: "files",
    name: "files",
    type: "file",
    multiple: true,
    onChange: handleFile
  }), React.createElement("span", null, form.files.length > 0 ? `📎 Файлов: ${form.files.length}` : form.photoUrl && form.photoUrl !== "Без фото" ? "📎 Файлы сохранены" : "📷 ПРИКРЕПИТЬ ДОКУМЕНТЫ"))), msg.text ? React.createElement("div", {
    className: `cash-message cash-message--${msg.type === "ok" ? "ok" : "error"}`
  }, msg.text) : null, React.createElement("button", {
    className: "cash-primary-button",
    disabled: isSubmitting,
    type: "submit"
  }, isSubmitting ? "ЗАГРУЗКА..." : form.id ? "ОБНОВИТЬ" : "СОХРАНИТЬ"))), React.createElement("section", {
    className: "cash-history-panel"
  }, React.createElement("div", {
    className: "cash-period-card"
  }, React.createElement("div", {
    className: "cash-section-label"
  }, "\u041F\u0435\u0440\u0438\u043E\u0434"), React.createElement("div", {
    className: "cash-month-tabs"
  }, monthTabs.map(month => React.createElement("button", {
    key: month,
    type: "button",
    className: `cash-month-tab ${selectedMonth === month ? "is-active" : ""}`,
    onClick: () => setSelectedMonth(month)
  }, month)))), React.createElement("div", {
    className: "cash-history-card"
  }, React.createElement("div", {
    className: "cash-history-header"
  }, React.createElement("h2", null, "\u041E\u041F\u0415\u0420\u0410\u0426\u0418\u0418 \u0417\u0410 ", selectedMonth), isSyncing ? React.createElement("span", null, "\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435...") : null), React.createElement("div", {
    className: "cash-history-list"
  }, currentList.map(tx => React.createElement("article", {
    className: "cash-transaction-card",
    key: tx.id
  }, React.createElement("div", {
    className: "cash-transaction-meta"
  }, React.createElement("span", {
    className: `cash-chip ${tx.amount < 0 ? "cash-chip--expense" : "cash-chip--income"}`
  }, tx.amount < 0 ? "РАСХОД" : "ПРИХОД"), React.createElement("span", {
    className: "cash-chip cash-chip--muted"
  }, tx.date), React.createElement("span", {
    className: "cash-chip cash-chip--pay"
  }, tx.paymentMethod)), React.createElement("div", {
    className: "cash-transaction-row"
  }, React.createElement("div", {
    className: "cash-transaction-main"
  }, React.createElement("div", {
    className: "cash-transaction-amount"
  }, formatAmount(Math.abs(tx.amount)), " \u20BD"), React.createElement("div", {
    className: "cash-transaction-category"
  }, tx.category, user.name === "Долматов Ю. М." ? ` | ${tx.employeeName}` : ""), React.createElement("div", {
    className: "cash-transaction-comment"
  }, "\"", tx.comment, "\""), tx.photoUrl && tx.photoUrl !== "Без фото" ? React.createElement("div", {
    className: "cash-file-list"
  }, tx.photoUrl.split(",").map((url, index) => React.createElement("a", {
    key: `${tx.id}-${index}`,
    className: "cash-file-chip",
    href: url.trim(),
    rel: "noopener noreferrer",
    target: "_blank"
  }, "\uD83D\uDCCE \u0424\u0410\u0419\u041B ", index + 1))) : null), React.createElement("button", {
    className: "cash-edit-button",
    type: "button",
    onClick: () => edit(tx),
    "aria-label": "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C"
  }, React.createElement("svg", {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    viewBox: "0 0 24 24"
  }, React.createElement("path", {
    d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
  })))))), currentList.length === 0 && !isSyncing ? React.createElement("div", {
    className: "cash-empty-state"
  }, "\u0417\u0430\u043F\u0438\u0441\u0435\u0439 \u043D\u0435\u0442") : null))))));
}
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App, null));
