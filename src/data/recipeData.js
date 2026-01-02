export const categories = [
  { id: 'breakfast', name: 'Завтрак', icon: '🍳' },
  { id: 'lunch', name: 'Обед', icon: '🍲' },
  { id: 'dinner', name: 'Ужин', icon: '🍽️' },
  { id: 'snacks', name: 'Перекус', icon: '🥪' },
  { id: 'desserts', name: 'Десерты', icon: '🍰' }
];

export const recipes = [
  {
    id: '1',
    title: 'Классическая Карбонара',
    category: 'dinner',
    time: '20 мин',
    difficulty: 'Средне',
    calories: 650,
    macros: { protein: 25, fats: 32, carbs: 65 },
    image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?auto=format&fit=crop&w=800&q=80',
    description: 'Аутентичный итальянский рецепт без сливок. Только желтки, пекорино романо и ароматный черный перец.',
    ingredients: [
      { name: 'Спагетти', amount: '200г', calories: 250 },
      { name: 'Гуанчиале или Бекон', amount: '100г', calories: 300 },
      { name: 'Яичные желтки', amount: '3 шт', calories: 60 },
      { name: 'Сыр Пармезан/Пекорино', amount: '40г', calories: 140 },
      { name: 'Черный перец', amount: 'по вкусу', calories: 0 }
    ],
    instructions: [
      'Поставьте вариться пасту в подсоленной воде.',
      'Обжарьте нарезанный бекон на сухой сковороде до золотистого цвета.',
      'В миске смешайте желтки с тертым сыром и большим количеством молотого перца.',
      'Слейте пасту, сохранив немного воды. Смешайте пасту с беконом.',
      'Снимите сковороду с огня! Влейте яичную смесь и быстро перемешивайте, добавляя воду от пасты для кремовости.'
    ]
  },
  {
    id: '2',
    title: 'Салат Цезарь с креветками',
    category: 'lunch',
    time: '25 мин',
    difficulty: 'Легко',
    calories: 420,
    macros: { protein: 28, fats: 22, carbs: 15 },
    image: 'https://images.unsplash.com/photo-1512852939750-1305098529bf?auto=format&fit=crop&w=800&q=80',
    description: 'Легкая вариация классики с обжаренными на чесночном масле тигровыми креветками.',
    ingredients: [
      { name: 'Креветки тигровые', amount: '200г', calories: 120 },
      { name: 'Салат Романо', amount: '1 пучок', calories: 10 },
      { name: 'Сухарики', amount: '30г', calories: 80 },
      { name: 'Соус Цезарь', amount: '40мл', calories: 150 },
      { name: 'Сыр Пармезан', amount: '15г', calories: 60 }
    ],
    instructions: [
      'Обжарьте креветки с чесноком по 2 минуты с каждой стороны.',
      'Порвите листья салата руками и выложите в большую миску.',
      'Заправьте салат соусом и аккуратно перемешайте.',
      'Сверху выложите креветки, крутоны и слайсы пармезана.',
      'Подавайте немедленно, чтобы сухарики не размокли.'
    ]
  },
  {
    id: '3',
    title: 'Тост с авокадо и яйцом пашот',
    category: 'breakfast',
    time: '12 мин',
    difficulty: 'Легко',
    calories: 350,
    macros: { protein: 14, fats: 22, carbs: 25 },
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80',
    description: 'Инстаграмный завтрак, который готовится за считанные минуты. Полезные жиры и белок для отличного начала дня.',
    ingredients: [
      { name: 'Цельнозерновой хлеб', amount: '1 ломтик', calories: 80 },
      { name: 'Авокадо', amount: '1/2 шт', calories: 160 },
      { name: 'Яйцо', amount: '1 шт', calories: 70 },
      { name: 'Микрозелень', amount: 'щепотка', calories: 0 },
      { name: 'Семена кунжута', amount: '1 ч.л.', calories: 40 }
    ],
    instructions: [
      'Подсушите хлеб в тостере или на сковороде.',
      'Разомните авокадо вилкой с солью и каплей лимонного сока.',
      'Приготовьте яйцо пашот (варить в воронке 3 минуты).',
      'Выложите авокадо на тост, сверху — яйцо.',
      'Украсьте микрозеленью и кунжутом.'
    ]
  },
  {
    id: '4',
    title: 'Ягодный смузи-боул',
    category: 'breakfast',
    time: '10 мин',
    difficulty: 'Легко',
    calories: 280,
    macros: { protein: 8, fats: 5, carbs: 45 },
    image: 'https://images.unsplash.com/photo-1494597564530-897b5a519c71?auto=format&fit=crop&w=800&q=80',
    description: 'Витаминный взрыв для бодрого утра. Густой смузи, который едят ложкой.',
    ingredients: [
      { name: 'Замороженные ягоды', amount: '150г', calories: 80 },
      { name: 'Банан', amount: '1 шт', calories: 100 },
      { name: 'Растительное молоко', amount: '100мл', calories: 40 },
      { name: 'Гранола', amount: '20г', calories: 60 }
    ],
    instructions: [
      'Взбейте в блендере ягоды, банан и молоко до густой консистенции.',
      'Перелейте в глубокую миску.',
      'Красиво выложите сверху гранолу, орехи или свежие ягоды.',
      'Наслаждайтесь полезным и красивым завтраком.'
    ]
  },
  {
    id: '5',
    title: 'Куриная грудка на гриле',
    category: 'dinner',
    time: '30 мин',
    difficulty: 'Легко',
    calories: 380,
    macros: { protein: 45, fats: 12, carbs: 8 },
    image: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
    description: 'Сочная куриная грудка с травами и гарниром из овощей.',
    ingredients: [
      { name: 'Куриная грудка', amount: '300г', calories: 280 },
      { name: 'Оливковое масло', amount: '1 ст.л.', calories: 100 },
      { name: 'Чеснок', amount: '2 зубчика', calories: 10 },
      { name: 'Розмарин', amount: '1 веточка', calories: 0 },
      { name: 'Лимон', amount: '1/2 шт', calories: 10 }
    ],
    instructions: [
      'Отбейте грудку до равномерной толщины.',
      'Замаринуйте в масле, чесноке и травах на 15 минут.',
      'Разогрейте гриль или сковороду-гриль до максимума.',
      'Обжарьте по 4-5 минут с каждой стороны.',
      'Дайте отдохнуть 5 минут, сбрызните лимоном.'
    ]
  },
  {
    id: '6',
    title: 'Тирамису',
    category: 'desserts',
    time: '40 мин',
    difficulty: 'Средне',
    calories: 450,
    macros: { protein: 8, fats: 28, carbs: 42 },
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    description: 'Классический итальянский десерт с кофе и маскарпоне. Нежный, воздушный и невероятно вкусный.',
    ingredients: [
      { name: 'Маскарпоне', amount: '250г', calories: 300 },
      { name: 'Савоярди', amount: '150г', calories: 250 },
      { name: 'Эспрессо', amount: '200мл', calories: 5 },
      { name: 'Яйца', amount: '3 шт', calories: 210 },
      { name: 'Какао', amount: '2 ст.л.', calories: 30 }
    ],
    instructions: [
      'Сварите крепкий эспрессо и остудите.',
      'Взбейте желтки с сахаром до пышной массы.',
      'Добавьте маскарпоне, аккуратно перемешайте.',
      'Быстро обмакните савоярди в кофе и выложите первый слой.',
      'Чередуйте слои печенья и крема, посыпьте какао.'
    ]
  },
  {
    id: '7',
    title: 'Греческий салат',
    category: 'lunch',
    time: '15 мин',
    difficulty: 'Легко',
    calories: 320,
    macros: { protein: 12, fats: 24, carbs: 16 },
    image: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80',
    description: 'Свежий средиземноморский салат с фетой и оливками. Простота и вкус в одной тарелке.',
    ingredients: [
      { name: 'Помидоры', amount: '2 шт', calories: 40 },
      { name: 'Огурец', amount: '1 шт', calories: 15 },
      { name: 'Фета', amount: '100г', calories: 180 },
      { name: 'Оливки', amount: '50г', calories: 60 },
      { name: 'Оливковое масло', amount: '2 ст.л.', calories: 200 }
    ],
    instructions: [
      'Нарежьте овощи крупными кубиками.',
      'Выложите в большую миску.',
      'Добавьте оливки и кубики феты.',
      'Заправьте оливковым маслом и орегано.',
      'Посолите и подавайте.'
    ]
  },
  {
    id: '8',
    title: 'Сэндвич с тунцом',
    category: 'snacks',
    time: '10 мин',
    difficulty: 'Легко',
    calories: 380,
    macros: { protein: 28, fats: 18, carbs: 32 },
    image: 'https://images.unsplash.com/photo-1554433607-66b5efe9d304?auto=format&fit=crop&w=800&q=80',
    description: 'Сытный перекус с тунцом и свежими овощами. Идеален для обеда на работе.',
    ingredients: [
      { name: 'Тунец консервированный', amount: '1 банка', calories: 180 },
      { name: 'Хлеб тостовый', amount: '2 ломтика', calories: 140 },
      { name: 'Майонез', amount: '1 ст.л.', calories: 90 },
      { name: 'Листья салата', amount: '2 листа', calories: 5 },
      { name: 'Помидор', amount: '1/2 шт', calories: 10 }
    ],
    instructions: [
      'Слейте жидкость из тунца и разомните вилкой.',
      'Смешайте с майонезом.',
      'Подсушите хлеб в тостере.',
      'Выложите салат, тунец и помидор.',
      'Накройте вторым ломтиком и разрежьте по диагонали.'
    ]
  },
  {
    id: '9',
    title: 'Панкейки с кленовым сиропом',
    category: 'breakfast',
    time: '20 мин',
    difficulty: 'Легко',
    calories: 420,
    macros: { protein: 10, fats: 12, carbs: 68 },
    image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80',
    description: 'Пышные американские панкейки с маслом и сиропом. Классика воскресного завтрака.',
    ingredients: [
      { name: 'Мука', amount: '150г', calories: 250 },
      { name: 'Молоко', amount: '200мл', calories: 100 },
      { name: 'Яйцо', amount: '1 шт', calories: 70 },
      { name: 'Сливочное масло', amount: '30г', calories: 220 },
      { name: 'Кленовый сироп', amount: '50мл', calories: 150 }
    ],
    instructions: [
      'Смешайте муку, разрыхлитель и щепотку соли.',
      'Добавьте молоко и яйцо, взбейте до однородности.',
      'Растопите масло и добавьте в тесто.',
      'Жарьте на среднем огне по 2 минуты с каждой стороны.',
      'Подавайте стопкой, полив сиропом.'
    ]
  },
  {
    id: '10',
    title: 'Шоколадный брауни',
    category: 'desserts',
    time: '45 мин',
    difficulty: 'Средне',
    calories: 380,
    macros: { protein: 5, fats: 22, carbs: 48 },
    image: 'https://images.unsplash.com/photo-1564355808539-22fda35bed7e?auto=format&fit=crop&w=800&q=80',
    description: 'Насыщенный шоколадный десерт с хрустящей корочкой и тягучей серединкой.',
    ingredients: [
      { name: 'Темный шоколад', amount: '150г', calories: 350 },
      { name: 'Сливочное масло', amount: '100г', calories: 720 },
      { name: 'Яйца', amount: '2 шт', calories: 140 },
      { name: 'Сахар', amount: '100г', calories: 400 },
      { name: 'Мука', amount: '50г', calories: 180 }
    ],
    instructions: [
      'Растопите шоколад с маслом на водяной бане.',
      'Взбейте яйца с сахаром до пышности.',
      'Соедините шоколадную и яичную смеси.',
      'Аккуратно вмешайте муку.',
      'Выпекайте при 180°C 25-30 минут.'
    ]
  }
];

