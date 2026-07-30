using Microsoft.Extensions.DependencyInjection.Extensions;
using System.Reflection;

namespace VAAdminPortalAPI
{
    public static class ServiceCollectionExtensions
    {
        /// <summary>
        ///     Try to registers all services from the given assembly where an interface whose name
        ///     starts with an I lives in a namespace with a class that has the same name. If the service type hasn't already been
        ///     registered.
        /// </summary>
        /// <param name="serviceCollection">The service registry.</param>
        /// <param name="assembly">The assembly.</param>
        /// <returns>The service collection.</returns>
        public static IServiceCollection AddSameNameSameNamespaceServices(this IServiceCollection serviceCollection, Assembly assembly)
        {
            var interfaces = from type in assembly.GetTypes()
                             where type.IsInterface &&
                                   type.Name.StartsWith("I", StringComparison.InvariantCulture)
                             select type;
            foreach (var interfaceType in interfaces)
            {
                var implementationName = interfaceType.Namespace + "." + interfaceType.Name.Substring(1);
                var implementationType = assembly.GetType(implementationName);
                if (implementationType != null
                     && interfaceType.IsAssignableFrom(implementationType))
                {
                    serviceCollection.TryAddTransient(interfaceType, implementationType);
                }
            }

            return serviceCollection;
        }
    }

    /// <summary>
    ///     The <see cref="TypeExtensions" /> provides an extension
    ///     method for generic type utility.
    /// </summary>
    public static class TypeExtensions
    {
        #region Public Methods

        /// <summary>
        ///     Determines whether an instance of the current generic type can be can be assigned to an instance of a specified
        ///     generic type.
        /// </summary>
        /// <param name="type">The current type.</param>
        /// <param name="genericType">The specified type.</param>
        /// <returns>
        ///     <c>True</c> if the current type inherits from the specified type ; else <c>False</c>
        /// </returns>
        public static bool IsAssignableToGenericType(this Type type, Type genericType)
        {
            return type.GetInterfaces().Any(it => it.IsGenericType && it.GetGenericTypeDefinition() == genericType)
                   || (type.IsGenericType && type.GetGenericTypeDefinition() == genericType)
                   || (type.BaseType != null && IsAssignableToGenericType(type.BaseType, genericType));
        }

        #endregion
    }
}
