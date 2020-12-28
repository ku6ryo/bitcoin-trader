from sklearn import preprocessing
import csv
import numpy as np
import tensorflow as tf
import time
import copy

print(tf.test.is_gpu_available(
    cuda_only=False,
    min_cuda_compute_capability=None
))

# https://towardsdatascience.com/cryptocurrency-price-prediction-using-lstms-tensorflow-for-hackers-part-iii-264fcdbccd3f

data = []
with open('../Coinbase_BTCUSD_minute.csv') as f:
    reader = csv.reader(f)
    for row in reader:
        if len(row) > 4:
            try:
                data.append(float(row[4]))
            except:
                pass
data = data[::-1]

scaler = preprocessing.MinMaxScaler()

close_price = np.array(data).reshape(-1, 1)

scaled_close = scaler.fit_transform(close_price)

scaled_close = scaled_close[~np.isnan(scaled_close)]
scaled_close = scaled_close.reshape(-1, 1)

SEQ_LEN = 60

def to_sequences(data, seq_len):
    d = []

    for index in range(len(data) - seq_len):
        points = copy.deepcopy(data[index: index + seq_len])
        y_index = index + seq_len + 12 * 60
        if y_index > len(data) - 1:
            points[seq_len - 1] = [0]
        else:
            points[seq_len - 1] = data[y_index]
        d.append(points)

    return np.array(d)

def preprocess(data_raw, seq_len, train_split):

    data = to_sequences(data_raw, seq_len)

    num_train = int(train_split * data.shape[0])

    X_train = data[:num_train, :-1, :]
    y_train = data[:num_train, -1, :]
    print(len(X_train[0]))

    X_test = data[num_train:, :-1, :]
    y_test = data[num_train:, -1, :]

    return X_train, y_train, X_test, y_test


X_train, y_train, X_test, y_test = preprocess(scaled_close, SEQ_LEN, train_split = 0.95)

# print(y_test)

DROPOUT = 0.2
WINDOW_SIZE = SEQ_LEN - 1

model = tf.keras.Sequential()

model.add(tf.keras.layers.Bidirectional(
  tf.compat.v1.keras.layers.LSTM(WINDOW_SIZE, return_sequences=True),
  input_shape=(WINDOW_SIZE, X_train.shape[-1])
))
model.add(tf.keras.layers.Dropout(rate=DROPOUT))

model.add(tf.keras.layers.Bidirectional(
  tf.compat.v1.keras.layers.LSTM((WINDOW_SIZE * 2), return_sequences=True)
))
model.add(tf.keras.layers.Dropout(rate=DROPOUT))

model.add(tf.keras.layers.Bidirectional(
  tf.compat.v1.keras.layers.LSTM(WINDOW_SIZE, return_sequences=False)
))

model.add(tf.keras.layers.Dense(units=1))

model.add(tf.keras.layers.Activation('linear'))

BATCH_SIZE = 64

model.compile(
    loss='mean_squared_error',
    optimizer='adam'
)

history = model.fit(
    X_train,
    y_train,
    epochs=1, # 50
    batch_size=BATCH_SIZE,
    shuffle=False,
    validation_split=0.1
)

y_hat = model.predict(X_test)

y_test_inverse = scaler.inverse_transform(y_test)
y_hat_inverse = scaler.inverse_transform(y_hat)

ts = time.time()
with open(str(ts) + '.csv', 'w') as f:
    for i in range(len(y_hat_inverse)):
        f.write(str(y_test_inverse[i][0]) + "," + str(y_hat_inverse[i][0]) + "\n")

"""
x_prediction = []
for i in range(24 * 60):
    x_prediction.append(len(data) + i)
y_prediction = model.predict(np.array(x_prediction))
with open(str(ts) + '_p.csv', 'w') as f:
    for i in range(len(y_prediction)):
        f.write(str(y_prediction[i][0]) + "\n")
"""
