export type Section = {
  id: string;
  title: string;
  children?: Section[];
};

export const ichE3Sections: Section[] = [
  { id: "1", title: "TITLE PAGE" },
  { id: "2", title: "SYNOPSIS" },
  { id: "3", title: "TABLE OF CONTENTS FOR THE INDIVIDUAL CLINICAL STUDY REPORT" },
  { id: "4", title: "LIST OF ABBREVIATIONS AND DEFINITION OF TERMS" },
  { id: "5", title: "ETHICS" },
  { id: "6", title: "INVESTIGATORS AND STUDY ADMINISTRATIVE STRUCTURE" },
  { id: "7", title: "INTRODUCTION" },
  { id: "8", title: "STUDY OBJECTIVES" },
  {
    id: "9",
    title: "INVESTIGATIONAL PLAN",
    children: [
        { id: "9.1", title: "Overall Study Design and Plan - Description" },
        { id: "9.2", title: "Discussion of Study Design, including the Choice of Control Groups" },
        { id: "9.3", title: "Selection of Study Population" },
        { id: "9.4", title: "Treatments" },
        { id: "9.5", title: "Efficacy and Safety Variables" },
        { id: "9.6", title: "Data Quality Assurance" },
        { id: "9.7", title: "Statistical Methods Planned in the Protocol and Determination of Sample Size" },
        { id: "9.8", title: "Changes in the Conduct of the Study or Planned Analyses" },
    ],
  },
  {
    id: "10",
    title: "STUDY PATIENTS",
    children: [
        { id: "10.1", title: "Disposition of Patients" },
        { id: "10.2", title: "Protocol Deviations" },
    ],
  },
  {
    id: "11",
    title: "EFFICACY EVALUATION",
    children: [
      { id: "11.1", title: "Data Sets Analysed" },
      { id: "11.2", title: "Demographic and Other Baseline Characteristics" },
      { id: "11.3", title: "Measurements of Treatment Compliance" },
      {
        id: "11.4",
        title: "Efficacy Results and Tabulations of Individual Patient Data",
      },
    ],
  },
  {
    id: "12",
    title: "SAFETY EVALUATION",
    children: [
      { id: "12.1", title: "Extent of Exposure" },
      { id: "12.2", title: "Adverse Events (AEs)" },
      { id: "12.3", title: "Deaths, Other Serious Adverse Events, and Other Significant Adverse Events" },
      { id: "12.4", title: "Clinical Laboratory Evaluations" },
      { id: "12.5", title: "Vital Signs, Physical Findings, and Other Observations Related to Safety" },
      { id: "12.6", title: "Safety Conclusions" },
    ],
  },
  { id: "13", title: "DISCUSSION AND OVERALL CONCLUSIONS" },
  { id: "14", title: "TABLES, FIGURES, AND GRAPHS REFERRED TO BUT NOT INCLUDED IN THE TEXT" },
  { id: "15", title: "REFERENCE LIST" },
  {
    id: "16",
    title: "APPENDICES",
    children: [
      { id: "16.1", title: "Study Information" },
      { id: "16.2", title: "Patient Data Listings" },
      { id: "16.3", title: "Case Report Forms" },
      { id: "16.4", title: "Interim Clinical Study Report(s)" },
    ],
  },
];
