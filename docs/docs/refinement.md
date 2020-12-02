# Data Refinement

✔️ Actively supported

## Description

This tool serves to help reduce the size of datasets by column and by row. The tool supports uploading files from the local device, Google Drive or Dropbox. The columns of these files are then displayed next to checkboxes which, when checked, ensures their inclusion in the exported file. Unchecking a column name means that it won't be included in the final result.

Additionally, a user can specify a row range to include in the final result.

## Refinement

### By Column

Column refinement is the simplest data refinement offered. Any column that is checked will be included in the final exported dataset, while any unchecked column will be excluded.

Clicking "Select All" will check all boxes, while "Select None" will uncheck all boxes.

### By Row

Row refinement allows the user to define ranges of data to select. Clicking "Create Row Range" adds a range dialogue. Two number input boxes appear. The first specifies the first row to include, while the second specifies the last row to include in the range (both range extremes are inclusive). Clicking the 'x' button will remove the range. If a row range isn't specified, all rows will be included.

### By Outlier

Outliers can often skew data, so this aspect of the refinement tool allows them to be easily removed. Firstly, enable the option by checking the box on the left of the outlier dialogue. Then specify the number of standard deviations that data is allowed to fall within without being excluded. Finally, check the columns that outliers should be removed from (note that only columns selected in the column refinement section will offer to have outliers removed). If an outlier is present in any of the selected columns for a data point, that data point is excluded from the final result. Non-selected columns are not affected by outlier removal.

### With Inclusion Queries

Inclusion queries are a system developed for this application that allow the user to specify an arithmetic condition that a data point must meet to be included in the exported result.

Clicking "Create Query" will add a query box. This textbook accepts user input that specifies a condition to meet. See [Writing a Query](docs/queries.md) for information on how to write an inclusion query. If a query is syntactically invalid, the box will turn red. Clicking export with a red query means that it won't be used by the refinement tool.

There are two query modes available: AND mode and OR mode. The former, AND mode, requires that a data point meet all inclusion queries to be included in the final result. The latter, OR mode, will include a data point if it matches just one inclusion query.