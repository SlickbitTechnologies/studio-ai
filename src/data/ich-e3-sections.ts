export type Section = {
  id: string;
  title: string;
  children?: Section[];
};

export const ichE3Sections: Section[] = [
  { id: "1", title: "Title Page" },
  { id: "2", title: "Synopsis" },
  { id: "3", title: "Table of Contents" },
  { id: "4", title: "List of Abbreviations and Definitions" },
  { id: "5", title: "Ethics" },
  { id: "6", title: "Investigators and Study Administrative Structure" },
  { id: "7", title: "Introduction" },
  { id: "8", title: "Study Objectives" },
  { id: "9", title: "Investigational Plan" },
  { id: "10", title: "Study Patients" },
  {
    id: "11",
    title: "Efficacy Evaluation",
    children: [
      {
        id: "11.1",
        title: "Data Sets Analysed",
      },
      {
        id: "11.2",
        title: "Demographic and Other Baseline Characteristics",
      },
      {
        id: "11.3",
        title: "Measurements of Treatment Compliance",
      },
      {
        id: "11.4",
        title: "Efficacy Results and Tabulations of Individual Patient Data",
        children: [
            { id: "11.4.1", title: "Analysis of Efficacy" },
            { id: "11.4.2", title: "Statistical/Analytical Issues" },
            { id: "11.4.3", title: "Tabulation of Individual Response Data" },
        ]
      },
    ],
  },
  {
    id: "12",
    title: "Safety Evaluation",
    children: [
        { id: "12.1", title: "Extent of Exposure" },
        { id: "12.2", title: "Adverse Events (AEs)" },
        { id: "12.3", title: "Deaths, Other Serious AEs, and Other Significant AEs" },
        { id: "12.4", title: "Clinical Laboratory Evaluations" },
    ]
  },
  { id: "13", title: "Discussion and Overall Conclusions" },
  { id: "14", title: "Tables, Figures, and Graphs Referred to but Not Included in the Text" },
  { id: "15", title: "Reference List" },
  { id: "16", title: "Appendices" },
];
