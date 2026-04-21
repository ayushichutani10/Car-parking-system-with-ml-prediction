import pandas as pd
import numpy as np
import os

# Generate 1500 rows of synthetic parking data
np.random.seed(42)

hours = np.random.randint(7, 19, 1500)  # 7 AM to 6 PM (18:59)
day_types = np.random.randint(0, 2, 1500)  # 0: Weekday, 1: Weekend

# Vehicle count heavily depends on time of day (peak at 10-12 and 16-17) and day type.
# We'll use a rough function to simulate this.
vehicle_counts = []
for h, d in zip(hours, day_types):
    base = 50
    if 9 <= h <= 11:
        base += 80
    elif 16 <= h <= 18:
        base += 60
    elif 12 <= h <= 15:
        base += 40
    
    if d == 1: # Weekend gets slightly fewer on average or different peaks, let's just reduce counts
        base -= 20
        
    noise = np.random.randint(-15, 16)
    count = max(0, base + noise)
    vehicle_counts.append(count)

df = pd.DataFrame({
    'hour': hours,
    'day_type': day_types,
    'vehicle_count': vehicle_counts
})

# Save to csv
output_path = os.path.join(os.path.dirname(__file__), 'parking_data.csv')
df.to_csv(output_path, index=False)
print(f"Dataset generated with {len(df)} rows at {output_path}")
