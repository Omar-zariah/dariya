# Unit economics — scenarios, not forecasts

All MAD values are illustrative operating *assumptions*, **not** market research, actual price quotes, competitor price validation, tax advice, or projections of actual demand.

`scenario-model.csv` includes three coherent sensitivity scenarios:

| Variable | Explanation |
|---|---|
| paying_homes | Number paying in each case, assumed stable all 12 months (aggressive simplification). |
| average_monthly_price_mad | Realized average collected recurring fee per home. |
| monthly_direct_cost_per_home_mad | All visits, agent time, travel, support, report review and fees allocated per home/month. |
| annual_fixed_cost_mad | Local managers, office, insurance, core software, admin, marketing (rough assumption). |
| annual_revenue_mad | paying_homes × price × 12. |
| annual_direct_cost_mad | paying_homes × direct_cost × 12. |
| annual_contribution_mad | Revenue − direct costs. |
| annual_operating_result_before_tax_mad | Contribution − fixed costs. |

One model from the earlier concept exploration estimated approximately **96,000 MAD/year for 300 homes** *before acquisition, setup and taxes* under a different set of assumptions. It should **not** be mixed with the scenarios here or presented as a validated result; all costs require fresh pilot measurement.

These scenarios EXCLUDE inflation, seasonality, bad debt, installation/onboarding cost, payment disputes, financing costs, value-added tax, income tax, depreciation, unforeseen damages, contractor pass-through revenue/cost, cash tied up in receivables and currency hedging. They make no claim about actual attainable subscriptions. Negative outcomes in two scenarios illustrate the importance of field costs and operating density.

To determine price, log real service-minutes, distance, cancellation, repeat-check and quality costs, then test paid purchase with the target MRE customer segment. Report month-by-month cohort retention; never assume every home stays subscribed for a full year.
