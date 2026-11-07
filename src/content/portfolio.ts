export const portfolio = {
  name: 'Chandra Vamshi Katineni',
  nameLines: ['Chandra Vamshi', 'Katineni'],
  sections: [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'education', label: 'Education' },
    { id: 'contact', label: 'Contact' },
  ],
} as const

export type SectionId = typeof portfolio.sections[number]['id']
