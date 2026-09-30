-- Extract the variables
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])

-- Remove any requests older than the time this request got here and the valid window from when it got here
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

-- Count what remains
local count = redis.call('ZCARD', key)

-- Check if the limit isn't full then add it if not don't add it.
if count < limit then
    redis.call('ZADD', key, now, now .. '-' .. math.random())
    redis.call('PEXPIRE', key, window)
    return 1
else
    return 0
end;