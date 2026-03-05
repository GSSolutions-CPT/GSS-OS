-- Create the hardware command queue
CREATE TABLE hardware_queue (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL, -- e.g., 'OPEN_DOOR', 'ADD_CREDENTIAL', 'REVOKE_CREDENTIAL'
    payload JSONB NOT NULL,           -- Contains the tag numbers, gate IDs, etc.
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Realtime for the local bridge to listen to
ALTER PUBLICATION supabase_realtime ADD TABLE hardware_queue;
