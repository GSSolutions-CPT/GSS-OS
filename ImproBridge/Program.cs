using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using ImproBridge;

IHost host = Host.CreateDefaultBuilder(args)
    .UseWindowsService() // Allows running natively as a Windows Service
    .ConfigureServices((hostContext, services) =>
    {
        services.AddHostedService<ImproWorker>();
    })
    .Build();

await host.RunAsync();


