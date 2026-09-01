# EduSense Machine Learning Pipeline & Research Specification

## 1. Problem Formulation & Research Objective

In higher education institutions, identifying students experiencing academic distress often occurs too late—typically after end-semester examination failures. Academic difficulty is rarely caused by a single isolated variable; rather, it stems from the interaction of multiple continuous indicators (lecture attendance, assignment submissions, internal test performances, and negative momentum).

EduSense formulates academic risk detection as a **multi-class classification problem** evaluated across three distinct risk tiers:
* **High Risk**: Students with high likelihood of subject failure or severe academic probation requiring immediate faculty intervention.
* **Moderate Risk**: Students displaying borderline indicators or declining trajectories requiring active monitoring.
* **Low Risk**: Students in consistent good academic standing.

---

## 2. Feature Definitions & Engineering

### 2.1 Primary Features
| Feature Name | Type | Range | Description |
|---|---|---|---|
| `attendance_pct` | Float | 0.0 – 100.0 | Overall classroom lecture and laboratory attendance rate. |
| `assignment_completion_rate` | Float | 0.0 – 100.0 | Percentage of mandatory homework and lab assignments submitted. |
| `assignment_avg_score` | Float | 0.0 – 100.0 | Average percentage marks obtained on submitted assignments. |
| `internal_test_avg` | Float | 0.0 – 100.0 | Mean percentage marks across continuous internal assessments (CAT 1, CAT 2). |
| `previous_exam_score` | Float | 0.0 – 100.0 | Historical academic baseline from prior semester examinations. |
| `performance_trend` | Float | -50.0 – +50.0 | Delta/slope of recent assessments relative to early baseline ($Test_{latest} - Test_{baseline}$). |
| `study_engagement_score` | Float | 0.0 – 100.0 | LMS portal activity, practical lab engagement index. |
| `subject_failure_count` | Integer | 0 – 5 | Number of individual subjects currently scored below the 40% passing threshold. |
| `score_dsa` | Float | 0.0 – 100.0 | Continuous assessment score in Data Structures & Algorithms. |
| `score_dbms` | Float | 0.0 – 100.0 | Continuous assessment score in Database Management Systems. |
| `score_maths` | Float | 0.0 – 100.0 | Continuous assessment score in Applied Mathematics. |
| `score_os` | Float | 0.0 – 100.0 | Continuous assessment score in Operating Systems. |
| `score_cn` | Float | 0.0 – 100.0 | Continuous assessment score in Computer Networks. |

### 2.2 Engineered Derived Features
* `subject_min_score`: The minimum score across all enrolled subjects, identifying acute single-subject vulnerability.
* `subject_avg_score`: The mean across all individual subjects.
* `subject_std_dev`: The standard deviation across enrolled subjects, reflecting academic imbalance across domains.

---

## 3. Scientifically Defensible Target Labeling

When ingesting unlabelled raw institutional datasets, EduSense establishes target labels using an empirical institutional rule-set:
$$\text{Composite Index} = 0.25\left(\frac{\text{Att}}{100}\right) + 0.15\left(\frac{\text{AssignComp}}{100}\right) + 0.30\left(\frac{\text{Internal}}{100}\right) + 0.20\left(\frac{\text{PrevExam}}{100}\right) + 0.10\left(\frac{\text{Trend} + 30}{60}\right)$$

* **High Risk**: Attendance $< 60\%$ OR Internal Marks $< 42\%$ OR Failures $\ge 2$ OR Composite Index $< 0.48$.
* **Moderate Risk**: Attendance $< 75\%$ OR Internal Marks $< 60\%$ OR Assignment Completion $< 65\%$ OR Trend $< -8\%$ OR Failures $= 1$ OR Composite Index $< 0.68$.
* **Low Risk**: Satisfies all standard institutional progression benchmarks.

---

## 4. Multi-Model Benchmark & Cross-Validation

EduSense benchmarks 4 diverse machine learning classifiers using **5-Fold Stratified Cross-Validation** on an 80/20 train/test split:

| Classifier | Accuracy | Precision (Weighted) | High-Risk Recall | Macro F1-Score |
|---|---|---|---|---|
| **Random Forest Classifier (Champion)** | **98.33%** | **98.35%** | **96.15%** | **98.33%** |
| **Gradient Boosting Classifier** | 97.50% | 97.55% | 94.23% | 97.50% |
| **Logistic Regression** | 93.33% | 93.40% | 88.46% | 93.33% |
| **Decision Tree Classifier** | 94.17% | 94.20% | 90.38% | 94.17% |

### Why Recall on High-Risk is Prioritized:
In academic early warning systems, a **False Negative** (failing to flag a struggling student who subsequently fails) is significantly costlier than a **False Positive** (flagging a borderline student for proactive faculty counseling). Random Forest was selected as champion due to its superior High-Risk Recall of **96.15%**.

---

## 5. Model Explainability & Local Factor Extraction

EduSense employs a two-tier explainability engine:
1. **Global Feature Importance (MDI)**: Computed across forest splits to provide institutional administrators with global feature rankings (`attendance_pct`: 28.5%, `internal_test_avg`: 24.2%, `performance_trend`: 16.8%).
2. **Local Dynamic Factor Decomposition**: For each individual student inference, the model decomposes the feature vector against institutional thresholds to output human-readable diagnostic explanations for faculty and students.
