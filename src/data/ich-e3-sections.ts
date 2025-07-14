export type Section = {
  id: string;
  title: string;
  children?: Section[];
};

export const ichE3Sections: Section[] = [
    { id: "1", title: "Title Page" },
    { id: "2", title: "Synopsis" },
    { id: "3", title: "Table of Contents for the Individual Clinical Study Report" },
    { id: "4", title: "List of Abbreviations and Definitions of Terms" },
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
        { id: "11.1", title: "Data Sets Analysed" },
        { id: "11.2", title: "Demographic and Other Baseline Characteristics" },
        { id: "11.3", title: "Measurements of Treatment Compliance" },
        {
          id: "11.4",
          title: "Efficacy Results and Tabulations of Individual Patient Data",
          children: [
            { id: "11.4.1", title: "Analysis of Efficacy" },
            { id: "11.4.2", title: "Statistical/Analytical Issues" },
            { id: "11.4.3", title: "Tabulation of Individual Response Data" },
            { id: "11.4.4", title: "Drug Dose, Drug Concentration, and Relationships to Response" },
            { id: "11.4.5", title: "Drug-Drug and Drug-Disease Interactions" },
            { id: "11.4.6", title: "By-Patient Displays" },
            { id: "11.4.7", title: "Efficacy Conclusions" },
          ],
        },
      ],
    },
    {
      id: "12",
      title: "Safety Evaluation",
      children: [
        { id: "12.1", title: "Extent of Exposure" },
        { id: "12.2", title: "Adverse Events (AEs)" },
        { id: "12.3", title: "Deaths, Other Serious Adverse Events, and Other Significant Adverse Events" },
        { id: "12.4", title: "Clinical Laboratory Evaluations" },
        { id: "12.5", title: "Vital Signs, Physical Findings, and Other Observations Related to Safety" },
        { id: "12.6", title: "Safety Conclusions" },
      ],
    },
    { id: "13", title: "Discussion and Overall Conclusions" },
    { id: "14", title: "Tables, Figures, and Graphs Referred to but Not Included in the Text" },
    { id: "15", title: "Reference List" },
    {
      id: "16",
      title: "Appendices",
      children: [
        { id: "16.1", title: "Study Information" },
        { id: "16.2", title: "Patient Data Listings" },
        { id: "16.3", title: "Case Report Forms" },
        { id: "16.4", title: "List of IECs or IRBs (or names of chairpersons)" },
      ],
    },
  ];
