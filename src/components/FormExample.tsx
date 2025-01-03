import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { Button, Label, TextInput } from 'flowbite-react';

// Define the form's field types
interface IFormInput {
  name: string;
  email: string;
  password: string;
}

const FormExample: React.FC = () => {
  const {
    register, // Register inputs
    handleSubmit, // Handle form submission
    formState: { errors }, // Access form errors
  } = useForm<IFormInput>();

  // Handle form submission
  const onSubmit: SubmitHandler<IFormInput> = (data) => {
    console.log(data); // Handle form data
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-w-md mx-auto"
    >
      {/* Name Input */}
      <div>
        <Label htmlFor="name" value="Your Name" />
        <TextInput
          id="name"
          type="text"
          placeholder="John Doe"
          {...register('name', { required: 'Name is required' })}
          color={errors.name ? 'failure' : undefined} // Error styling
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}
      </div>

      {/* Email Input */}
      <div>
        <Label htmlFor="email" value="Your Email" />
        <TextInput
          id="email"
          type="email"
          placeholder="example@example.com"
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
              message: 'Invalid email address',
            },
          })}
          color={errors.email ? 'failure' : undefined} // Error styling
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      {/* Password Input */}
      <div>
        <Label htmlFor="password" value="Password" />
        <TextInput
          id="password"
          type="password"
          placeholder="******"
          {...register('password', {
            required: 'Password is required',
            minLength: {
              value: 6,
              message: 'Password must be at least 6 characters',
            },
          })}
          color={errors.password ? 'failure' : undefined} // Error styling
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" gradientMonochrome="info">
        Submit
      </Button>
    </form>
  );
};

export default FormExample;
