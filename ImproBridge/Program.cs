using System;
using System.Linq;
using Supabase.Realtime;

Console.WriteLine("--- Types ---");
var types = typeof(RealtimeChannel).Assembly.GetTypes();
foreach (var type in types.Where(t => t.Name.Contains("PostgresChanges") || t.Name.Contains("Payload")))
{
    Console.WriteLine($"\nType: {type.Name}");
    foreach (var p in type.GetProperties())
    {
        Console.WriteLine($"  Prop: {p.PropertyType.Name} {p.Name}");
    }
}


