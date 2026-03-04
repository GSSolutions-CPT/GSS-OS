CREATE TABLE public.visitor_access_windows (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    visitor_id uuid REFERENCES public.visitors(id) ON DELETE CASCADE NOT NULL,
    access_date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.visitor_access_windows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view schedules of their visitors" ON public.visitor_access_windows 
FOR SELECT USING (
    visitor_id IN (SELECT id FROM public.visitors WHERE owner_id = auth.uid())
);

CREATE POLICY "Users can insert schedules for their visitors" ON public.visitor_access_windows 
FOR INSERT WITH CHECK (
    visitor_id IN (SELECT id FROM public.visitors WHERE owner_id = auth.uid())
);
