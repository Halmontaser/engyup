export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'select' | 'boolean' | 'array' | 'media';
  required?: boolean;
  placeholder?: string;
  options?: {label: string; value: any}[];
  fields?: FormField[];
  arrayConfig?: {
    minItems?: number;
    maxItems?: number;
    itemLabel: string;
    addItemLabel: string;
  };
  helpText?: string;
}

export interface ActivityFormSchema {
  type: string;
  label: string;
  description: string;
  icon: string;
  fields: FormField[];
}

export const activityFormSchemas: Record<string, ActivityFormSchema> = {
  'mcq': {
    type: 'mcq',
    label: 'Multiple Choice',
    description: 'Create questions with multiple answer options',
    icon: 'HelpCircle',
    fields: [
      {
        name: 'questions',
        label: 'Questions',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Question', addItemLabel: 'Add Question' },
        fields: [
          {
            name: 'question',
            label: 'Question Text',
            type: 'textarea',
            required: true,
            placeholder: 'Enter your question here...'
          },
          {
            name: 'image',
            label: 'Question Image (optional)',
            type: 'text',
            placeholder: '/images/your-image.jpg or http://...'
          },
          {
            name: 'audio',
            label: 'Question Audio (optional)',
            type: 'text',
            placeholder: '/audio/your-audio.mp3 or http://...'
          },
          {
            name: 'explanation',
            label: 'Explanation (shown after answering)',
            type: 'textarea',
            placeholder: 'Explanation for this question...'
          },
          {
            name: 'options',
            label: 'Answer Options',
            type: 'array',
            required: true,
            arrayConfig: { minItems: 2, itemLabel: 'Option', addItemLabel: 'Add Option' },
            fields: [
              { name: 'text', label: 'Option Text', type: 'text', required: true },
              { name: 'image', label: 'Option Image (optional)', type: 'text' },
              { name: 'audio', label: 'Option Audio (optional)', type: 'text' },
              { name: 'isCorrect', label: 'Correct Answer', type: 'boolean', required: true },
              { name: 'feedback', label: 'Feedback (optional)', type: 'textarea' }
            ]
          }
        ]
      }
    ]
  },
  'flashcard': {
    type: 'flashcard',
    label: 'Flashcards',
    description: 'Create vocabulary flashcards with definitions',
    icon: 'CreditCard',
    fields: [
      {
        name: 'items',
        label: 'Flashcards',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Card', addItemLabel: 'Add Card' },
        fields: [
          { name: 'word', label: 'Word / Term', type: 'text', required: true, placeholder: 'Enter the word...' },
          { name: 'term', label: 'Term (alternative)', type: 'text', placeholder: 'Alternative to word...' },
          { name: 'front', label: 'Front Text (alternative)', type: 'textarea', placeholder: 'Alternative to word...' },
          { name: 'definition', label: 'Definition / Meaning', type: 'textarea', required: true, placeholder: 'Enter the definition...' },
          { name: 'meaning', label: 'Meaning (alternative)', type: 'textarea', placeholder: 'Alternative to definition...' },
          { name: 'back', label: 'Back Text (alternative)', type: 'textarea', placeholder: 'Alternative to definition...' },
          { name: 'translation', label: 'Translation (optional)', type: 'textarea', placeholder: 'Enter translation...' },
          { name: 'example', label: 'Example Sentence', type: 'textarea', placeholder: 'Enter an example sentence...' }
        ]
      }
    ]
  },
  'gap-fill': {
    type: 'gap-fill',
    label: 'Gap Fill',
    description: 'Create sentences with blanks to fill in',
    icon: 'PencilLine',
    fields: [
      {
        name: 'sentences',
        label: 'Sentences',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Sentence', addItemLabel: 'Add Sentence' },
        fields: [
          {
            name: 'text',
            label: 'Sentence Text',
            type: 'textarea',
            required: true,
            helpText: 'Use ___ (3 or more underscores) for blanks',
            placeholder: 'The cat ___ on the mat.'
          },
          {
            name: 'blanks',
            label: 'Blank Answers',
            type: 'array',
            arrayConfig: { itemLabel: 'Blank', addItemLabel: 'Add Blank' },
            fields: [
              { name: 'answer', label: 'Correct Answer', type: 'text', required: true },
              { name: 'word', label: 'Word (alternative to answer)', type: 'text' },
              { name: 'alternatives', label: 'Alternative Answers (comma-separated)', type: 'text', placeholder: 'sit, sits, is sitting' },
              { name: 'hint', label: 'Hint (optional)', type: 'text' }
            ]
          }
        ]
      }
    ]
  },
  'match-pairs': {
    type: 'match-pairs',
    label: 'Match Pairs',
    description: 'Create matching exercises with pairs',
    icon: 'GitBranch',
    fields: [
      {
        name: 'pairs',
        label: 'Pairs',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 2, itemLabel: 'Pair', addItemLabel: 'Add Pair' },
        fields: [
          { name: 'left', label: 'Left Item', type: 'text', required: true },
          { name: 'right', label: 'Right Item', type: 'text', required: true }
        ]
      }
    ]
  },
  'true-false': {
    type: 'true-false',
    label: 'True / False',
    description: 'Create true/false statements',
    icon: 'CheckCircle',
    fields: [
      {
        name: 'statements',
        label: 'Statements',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Statement', addItemLabel: 'Add Statement' },
        fields: [
          { name: 'statement', label: 'Statement Text', type: 'textarea', required: true },
          { name: 'isTrue', label: 'Is This True?', type: 'boolean', required: true },
          { name: 'explanation', label: 'Explanation', type: 'textarea', placeholder: 'Explanation for the answer...' }
        ]
      }
    ]
  },
  'word-order': {
    type: 'word-order',
    label: 'Word Order',
    description: 'Create sentence reordering exercises',
    icon: 'ArrowUpDown',
    fields: [
      {
        name: 'sentences',
        label: 'Sentences',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Sentence', addItemLabel: 'Add Sentence' },
        fields: [
          {
            name: 'correctOrder',
            label: 'Correct Order (array or space-separated)',
            type: 'textarea',
            required: true,
            placeholder: '["The", "cat", "sat", "on", "the", "mat"] or The cat sat on the mat'
          },
          {
            name: 'answer',
            label: 'Answer (alternative to correctOrder)',
            type: 'textarea',
            placeholder: 'The cat sat on the mat'
          }
        ]
      }
    ]
  },
  'reading-passage': {
    type: 'reading-passage',
    label: 'Reading Passage',
    description: 'Create reading passages with comprehension questions',
    icon: 'BookOpen',
    fields: [
      { name: 'title', label: 'Passage Title (optional)', type: 'text' },
      { name: 'passage', label: 'Passage Text', type: 'textarea', required: true },
      {
        name: 'highlightWords',
        label: 'Words to Highlight (comma-separated)',
        type: 'text',
        placeholder: 'important, key, words'
      },
      {
        name: 'questions',
        label: 'Comprehension Questions',
        type: 'array',
        arrayConfig: { itemLabel: 'Question', addItemLabel: 'Add Question' },
        fields: [
          { name: 'question', label: 'Question Text', type: 'textarea', required: true },
          { name: 'text', label: 'Question (alternative)', type: 'textarea' }
        ]
      }
    ]
  },
  'category-sort': {
    type: 'category-sort',
    label: 'Category Sort',
    description: 'Create categorization exercises',
    icon: 'FolderKanban',
    fields: [
      {
        name: 'categories',
        label: 'Categories',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Category', addItemLabel: 'Add Category' },
        fields: [
          { name: 'name', label: 'Category Name', type: 'text', required: true },
          {
            name: 'items',
            label: 'Items in Category',
            type: 'array',
            arrayConfig: { minItems: 1, itemLabel: 'Item', addItemLabel: 'Add Item' },
            fields: [
              { name: 'text', label: 'Item Text', type: 'text', required: true }
            ]
          }
        ]
      }
    ]
  },
  'dialogue-read': {
    type: 'dialogue-read',
    label: 'Dialogue Read',
    description: 'Create dialogue readings with word bank',
    icon: 'MessageCircle',
    fields: [
      {
        name: 'lines',
        label: 'Dialogue Lines',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Line', addItemLabel: 'Add Line' },
        fields: [
          { name: 'speaker', label: 'Speaker Name', type: 'text', required: true },
          { name: 'text', label: 'Dialogue Text', type: 'textarea', required: true }
        ]
      },
      {
        name: 'wordBank',
        label: 'Word Bank (optional)',
        type: 'array',
        arrayConfig: { itemLabel: 'Word', addItemLabel: 'Add Word' },
        fields: [
          { name: 'text', label: 'Word', type: 'text' }
        ]
      }
    ]
  },
  'transform-sentence': {
    type: 'transform-sentence',
    label: 'Transform Sentence',
    description: 'Create sentence transformation exercises',
    icon: 'RefreshCw',
    fields: [
      {
        name: 'sentences',
        label: 'Sentences',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Sentence', addItemLabel: 'Add Sentence' },
        fields: [
          { name: 'prompt', label: 'Original Sentence', type: 'textarea', required: true },
          { name: 'original', label: 'Original (alternative to prompt)', type: 'textarea' },
          { name: 'answer', label: 'Correct Transformed Sentence', type: 'textarea', required: true },
          { name: 'correct', label: 'Correct Answer (alternative)', type: 'textarea' },
          { name: 'hint', label: 'Hint (optional)', type: 'textarea' }
        ]
      }
    ]
  },
  'image-label': {
    type: 'image-label',
    label: 'Image Label',
    description: 'Create image labeling exercises',
    icon: 'MapPin',
    fields: [
      {
        name: 'image',
        label: 'Image URL',
        type: 'text',
        placeholder: '/images/your-image.jpg or http://...'
      },
      {
        name: 'hotspots',
        label: 'Labels',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Label', addItemLabel: 'Add Label' },
        fields: [
          { name: 'id', label: 'Label ID', type: 'text', required: true },
          { name: 'label', label: 'Correct Answer', type: 'text', required: true },
          { name: 'x', label: 'X Position (percentage)', type: 'number', placeholder: '50' },
          { name: 'y', label: 'Y Position (percentage)', type: 'number', placeholder: '50' },
          { name: 'width', label: 'Width (optional)', type: 'number' },
          { name: 'height', label: 'Height (optional)', type: 'number' }
        ]
      }
    ]
  },
  'guessing-game': {
    type: 'guessing-game',
    label: 'Guessing Game',
    description: 'Create puzzle-based guessing games',
    icon: 'HelpCircle',
    fields: [
      {
        name: 'puzzles',
        label: 'Puzzles',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Puzzle', addItemLabel: 'Add Puzzle' },
        fields: [
          { name: 'answer', label: 'Answer', type: 'text', required: true },
          { name: 'hint', label: 'Hint (optional)', type: 'textarea' },
          {
            name: 'clues',
            label: 'Clues',
            type: 'array',
            arrayConfig: { minItems: 1, itemLabel: 'Clue', addItemLabel: 'Add Clue' },
            fields: [
              { name: 'text', label: 'Clue Text', type: 'textarea', required: true }
            ]
          }
        ]
      }
    ]
  },
  'reading-sequence': {
    type: 'reading-sequence',
    label: 'Reading Sequence',
    description: 'Create sequencing exercises',
    icon: 'ArrowUpDown',
    fields: [
      {
        name: 'items',
        label: 'Sequence Items',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Item', addItemLabel: 'Add Item' },
        fields: [
          { name: 'text', label: 'Item Text', type: 'textarea', required: true }
        ]
      },
      {
        name: 'steps',
        label: 'Steps (alternative to items)',
        type: 'array',
        arrayConfig: { itemLabel: 'Step', addItemLabel: 'Add Step' },
        fields: [
          { name: 'text', label: 'Step Text', type: 'textarea' }
        ]
      },
      {
        name: 'events',
        label: 'Events (alternative to items)',
        type: 'array',
        arrayConfig: { itemLabel: 'Event', addItemLabel: 'Add Event' },
        fields: [
          { name: 'text', label: 'Event Text', type: 'textarea' }
        ]
      }
    ]
  },
  'pronunciation-practice': {
    type: 'pronunciation-practice',
    label: 'Pronunciation Practice',
    description: 'Create pronunciation exercises with words',
    icon: 'Mic',
    fields: [
      {
        name: 'words',
        label: 'Words',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Word', addItemLabel: 'Add Word' },
        fields: [
          { name: 'word', label: 'Word', type: 'text', required: true },
          { name: 'phonetic', label: 'Phonetic (optional)', type: 'text', placeholder: '/wɜːrd/' },
          {
            name: 'syllables',
            label: 'Syllables (comma-separated)',
            type: 'text',
            placeholder: 'pron, un, ci, a, tion'
          },
          { name: 'audioSrc', label: 'Audio URL (optional)', type: 'text', placeholder: '/audio/word.mp3' }
        ]
      }
    ]
  },
  'listening-comprehension': {
    type: 'listening-comprehension',
    label: 'Listening Comprehension',
    description: 'Create audio-based comprehension exercises',
    icon: 'Headphones',
    fields: [
      { name: 'transcript', label: 'Transcript', type: 'textarea', placeholder: 'Full audio transcript...' },
      {
        name: 'questions',
        label: 'Comprehension Questions',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Question', addItemLabel: 'Add Question' },
        fields: [
          { name: 'question', label: 'Question Text', type: 'textarea', required: true },
          {
            name: 'options',
            label: 'Answer Options',
            type: 'array',
            required: true,
            arrayConfig: { minItems: 2, itemLabel: 'Option', addItemLabel: 'Add Option' },
            fields: [
              { name: 'text', label: 'Option Text', type: 'text', required: true },
              { name: 'isCorrect', label: 'Correct Answer', type: 'boolean', required: true }
            ]
          }
        ]
      }
    ]
  },
  'spelling-bee': {
    type: 'spelling-bee',
    label: 'Spelling Bee',
    description: 'Create spelling exercises with scrambled letters',
    icon: 'PenTool',
    fields: [
      {
        name: 'words',
        label: 'Words',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Word', addItemLabel: 'Add Word' },
        fields: [
          { name: 'word', label: 'Correct Spelling', type: 'text', required: true },
          { name: 'hint', label: 'Hint (optional)', type: 'text', placeholder: 'A small pet...' },
          {
            name: 'scrambled',
            label: 'Scrambled Letters (optional)',
            type: 'text',
            placeholder: 'Leave empty to auto-scramble'
          },
          { name: 'audio', label: 'Audio URL (optional)', type: 'text', placeholder: '/audio/word.mp3' }
        ]
      }
    ]
  },
  'dictation': {
    type: 'dictation',
    label: 'Dictation',
    description: 'Create audio dictation exercises',
    icon: 'Mic',
    fields: [
      {
        name: 'sentences',
        label: 'Sentences',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Sentence', addItemLabel: 'Add Sentence' },
        fields: [
          { name: 'expectedText', label: 'Expected Text', type: 'textarea', required: true },
          { name: 'difficulty', label: 'Difficulty (optional)', type: 'select', options: [
            { label: 'Easy', value: 'Easy' },
            { label: 'Medium', value: 'Medium' },
            { label: 'Hard', value: 'Hard' }
          ] },
          {
            name: 'hints',
            label: 'Hints (optional)',
            type: 'array',
            arrayConfig: { itemLabel: 'Hint', addItemLabel: 'Add Hint' },
            fields: [
              { name: 'text', label: 'Hint Text', type: 'textarea' }
            ]
          }
        ]
      }
    ]
  },
  'conversation-sim': {
    type: 'conversation-sim',
    label: 'Conversation Simulation',
    description: 'Create interactive conversation simulations',
    icon: 'MessageSquare',
    fields: [
      { name: 'scenario', label: 'Scenario Description', type: 'textarea', placeholder: 'Describe the context of the conversation...' },
      {
        name: 'turns',
        label: 'Conversation Turns',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Turn', addItemLabel: 'Add Turn' },
        fields: [
          { name: 'speaker', label: 'Speaker Name', type: 'text', required: true },
          { name: 'text', label: 'Dialogue', type: 'textarea', required: true },
          {
            name: 'studentOptions',
            label: 'Student Response Options (leave empty for non-interactive turns)',
            type: 'array',
            arrayConfig: { itemLabel: 'Option', addItemLabel: 'Add Option' },
            fields: [
              { name: 'text', label: 'Response Text', type: 'text', required: true },
              { name: 'isCorrect', label: 'Correct Response?', type: 'boolean', required: true },
              { name: 'nextTurn', label: 'Next Turn Index (optional)', type: 'number', placeholder: 'Leave empty for next turn' },
              { name: 'feedback', label: 'Feedback (optional)', type: 'textarea' }
            ]
          }
        ]
      }
    ]
  },
  'picture-description': {
    type: 'picture-description',
    label: 'Picture Description',
    description: 'Create image description exercises',
    icon: 'Image',
    fields: [
      { name: 'image', label: 'Image URL', type: 'text', placeholder: '/images/your-image.jpg or http://...' },
      {
        name: 'keywords',
        label: 'Keywords (comma-separated)',
        type: 'text',
        placeholder: 'important, key, words'
      },
      {
        name: 'promptQuestions',
        label: 'Questions',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Question', addItemLabel: 'Add Question' },
        fields: [
          { name: 'text', label: 'Question Text', type: 'textarea', required: true }
        ]
      },
      {
        name: 'sampleAnswers',
        label: 'Sample Answers (optional)',
        type: 'array',
        arrayConfig: { itemLabel: 'Answer', addItemLabel: 'Add Answer' },
        fields: [
          { name: 'text', label: 'Sample Answer', type: 'textarea' }
        ]
      }
    ]
  },
  'sentence-builder': {
    type: 'sentence-builder',
    label: 'Sentence Builder',
    description: 'Create sentence building exercises (uses word-order component)',
    icon: 'Construction',
    fields: [
      {
        name: 'sentences',
        label: 'Sentences',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 1, itemLabel: 'Sentence', addItemLabel: 'Add Sentence' },
        fields: [
          {
            name: 'correctOrder',
            label: 'Correct Order (array or space-separated)',
            type: 'textarea',
            required: true,
            placeholder: '["The", "cat", "sat"] or The cat sat'
          },
          {
            name: 'answer',
            label: 'Answer (alternative)',
            type: 'textarea'
          }
        ]
      }
    ]
  },
  'word-association': {
    type: 'word-association',
    label: 'Word Association',
    description: 'Create word matching exercises (uses match-pairs component)',
    icon: 'Link',
    fields: [
      {
        name: 'pairs',
        label: 'Word Pairs',
        type: 'array',
        required: true,
        arrayConfig: { minItems: 2, itemLabel: 'Pair', addItemLabel: 'Add Pair' },
        fields: [
          { name: 'left', label: 'First Word', type: 'text', required: true },
          { name: 'right', label: 'Associated Word', type: 'text', required: true }
        ]
      }
    ]
  }
};

export const allActivityTypes = Object.values(activityFormSchemas);

export const activityTypeLabels: Record<string, string> = Object.fromEntries(
  Object.entries(activityFormSchemas).map(([type, schema]) => [type, schema.label])
);

export function getFormSchema(type: string): ActivityFormSchema | undefined {
  // Handle aliases
  const aliasMap: Record<string, string> = {
    'sentence-builder': 'word-order',
    'word-association': 'match-pairs'
  };
  const actualType = aliasMap[type] || type;
  return activityFormSchemas[actualType];
}

export function getActivityIcon(type: string): string {
  const schema = getFormSchema(type);
  return schema?.icon || 'HelpCircle';
}
